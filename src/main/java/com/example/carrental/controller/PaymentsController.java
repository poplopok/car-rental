
package com.example.carrental.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.carrental.dto.request.PaymentRequestDto;

import com.example.carrental.dto.response.PaymentResponseDto;
import com.example.carrental.service.PaymentService;

@RestController
@RequestMapping("/payments")
public class PaymentsController {

    private final PaymentService paymentService;

    public PaymentsController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/rentals/{rentalId}")
    public ResponseEntity<PaymentResponseDto> createPayment(
            @PathVariable Long rentalId,
            @RequestBody PaymentRequestDto request,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();

        PaymentResponseDto response = paymentService.createPayment(rentalId, userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER')")
    public ResponseEntity<PaymentResponseDto> getPaymentById(
            @PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        PaymentResponseDto response = paymentService.getPaymentById(id, userId);

        return ResponseEntity.ok(response);
    }

    // @GetMapping
    // @PreAuthorize("hasAnyRole('ADMIN')")
    // public ResponseEntity<PaymentResponseDto> getPaymentById(
    // @RequestParam Long paymentId) {
    // PaymentResponseDto response = paymentService.getPaymentById(paymentId);

    // return ResponseEntity.ok(response);
    // }
}
