package com.example.carrental.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.response.PaymentResponseDto;
import com.example.carrental.dto.response.RentalResponseDto;
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

    @DeleteMapping("/me")
    public ResponseEntity<String> deleteCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        String response = userService.deleteUserById(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/rentals")
    public ResponseEntity<List<RentalResponseDto>> getCurrentUserRentals(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        List<RentalResponseDto> response = userService.getRentalsById(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/payments")
    public ResponseEntity<List<PaymentResponseDto>> getCurrentUserPayments(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        List<PaymentResponseDto> response = userService.getPaymentsById(userId);

        return ResponseEntity.ok(response);
    }
}