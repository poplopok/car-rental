package com.example.carrental.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.carrental.dto.request.LoginRequestDto;
import com.example.carrental.dto.request.RegisterRequestDto;
import com.example.carrental.dto.response.AuthResponseDto;
import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.entity.User;
import com.example.carrental.enums.TokenStatus;
import com.example.carrental.enums.UserRole;
import com.example.carrental.exception.InvalidCredentialsException;
import com.example.carrental.exception.UserAlreadyExistsException;
import com.example.carrental.exception.UserNotFoundException;
import com.example.carrental.mapper.UserMapper;
import com.example.carrental.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

    public AuthResponseDto login(LoginRequestDto request) {
        String email = request.getEmail();
        String password = request.getPassword();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getRole().name());

        String refreshToken = jwtService.generateRefreshToken(user.getId());

        AuthResponseDto response = new AuthResponseDto();
        UserResponseDto userResponseDto = userMapper.convertToUserResponseDto(user);

        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUser(userResponseDto);

        return response;
    }

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        User user = userMapper.convertToUser(request);

        if (userRepository.existsByUsernameOrEmailOrPhone(user.getUsername(), user.getEmail(), user.getPhone())) {
            throw new UserAlreadyExistsException("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User savedUser = userRepository.save(user);
        UserResponseDto userResponseDto = userMapper.convertToUserResponseDto(savedUser);

        Long savedUserId = savedUser.getId();
        String accessToken = jwtService.generateAccessToken(
                savedUserId, savedUser.getRole().name());

        String refreshToken = jwtService.generateRefreshToken(savedUserId);

        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUser(userResponseDto);

        return response;
    }

    public AuthResponseDto refreshToken(String refreshToken) {

        TokenStatus tokenStatus = jwtService.validateToken(refreshToken, "refresh");

        if (tokenStatus != TokenStatus.VALID) {
            throw new InvalidCredentialsException("Invalid refresh token");
        }

        Long userId = jwtService.extractUserId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        UserRole role = user.getRole();

        String accessToken = jwtService.generateAccessToken(userId, role.name());
        String newRefreshToken = jwtService.generateRefreshToken(userId);

        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(newRefreshToken);
        response.setUser(userMapper.convertToUserResponseDto(user));

        return response;
    }

    public UserResponseDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return userMapper.convertToUserResponseDto(user);
    }
}
