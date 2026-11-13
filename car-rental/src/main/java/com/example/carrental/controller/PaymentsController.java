
package com.example.carrental.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            @RequestBody PaymentRequestDto request) {

        PaymentResponseDto response = paymentService.createPayment(rentalId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDto> getPaymentById(
            @PathVariable Long id) {

        PaymentResponseDto response = paymentService.getPaymentById(id);

        return ResponseEntity.ok(response);
    }
}
