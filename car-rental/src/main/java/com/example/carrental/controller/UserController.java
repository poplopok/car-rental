package com.example.carrental.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.request.UserRequestDto;
import com.example.carrental.dto.response.PaymentResponseDto;
import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(
            @RequestBody UserRequestDto request) {

        UserResponseDto response = userService.createUser(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> findUserById(@PathVariable Long id) {
        UserResponseDto response = userService.findUserById(id);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUserById(@PathVariable Long id) {
        String response = userService.deleteUserById(id);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}/rentals")
    public ResponseEntity<List<RentalResponseDto>> getRentalsById(@PathVariable Long id) {
        List<RentalResponseDto> response = userService.getRentalsById(id);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsById(@PathVariable Long id) {
        List<PaymentResponseDto> response = userService.getPaymentsById(id);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
