package com.example.carrental.mapper;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.carrental.dto.request.RegisterRequestDto;

import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.entity.User;

@Component
public class UserMapper {

    PasswordEncoder passwordEncoder;

    public UserMapper(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public User convertToUser(RegisterRequestDto request) {
        User user = new User();

        user.setDateOfBirth(request.getDateOfBirth());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setUsername(request.getUsername());

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        return user;
    }

    public UserResponseDto convertToUserResponseDto(User user) {
        UserResponseDto response = new UserResponseDto();

        response.setId(user.getId());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setUsername(user.getUsername());

        return response;
    }
}
