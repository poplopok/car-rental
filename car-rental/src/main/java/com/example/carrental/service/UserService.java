package com.example.carrental.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.carrental.dto.request.UserRequestDto;
import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.entity.User;
import com.example.carrental.exception.UserAlreadyExistsException;
import com.example.carrental.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponseDto createUser(UserRequestDto request) {
        User user = new User();
        user.setDateOfBirth(request.getDateOfBirth());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setUsername(request.getUsername());

        if (userRepository.existsByUsernameOrEmailOrPhone(user.getUsername(), user.getEmail(), user.getPhone())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        User savedUser = userRepository.save(user);

        UserResponseDto response = new UserResponseDto();

        response.setId(savedUser.getId());
        response.setDateOfBirth(savedUser.getDateOfBirth());
        response.setEmail(savedUser.getEmail());
        response.setFirstName(savedUser.getFirstName());
        response.setLastName(savedUser.getLastName());
        response.setPhone(savedUser.getPhone());
        response.setUsername(savedUser.getUsername());

        return response;
    }

}
