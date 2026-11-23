package com.example.carrental.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        UserResponseDto user = userService.findUserById(userId);

        return ResponseEntity.ok(user);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<UserResponseDto> getCurrentUser(@RequestParam Long userId) {

        UserResponseDto user = userService.findUserById(userId);

        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/me")
    public ResponseEntity<String> deleteCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        String response = userService.deleteUserById(userId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<String> deleteCurrentUser(@RequestParam Long userId) {

        String response = userService.deleteUserById(userId);

        return ResponseEntity.ok(response);
    }
}