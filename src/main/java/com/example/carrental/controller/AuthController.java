package com.example.carrental.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.request.LoginRequestDto;
import com.example.carrental.dto.request.RegisterRequestDto;
import com.example.carrental.dto.response.AuthResponseDto;
import com.example.carrental.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto responseDto = authService.register(request);

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto responseDto = authService.login(request);

        return ResponseEntity.ok(responseDto);
    }

}
