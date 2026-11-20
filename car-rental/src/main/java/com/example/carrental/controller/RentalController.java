
package com.example.carrental.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.carrental.dto.request.RentalRequestDto;
import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.service.RentalService;

@RestController
@RequestMapping("/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @PostMapping
    public ResponseEntity<RentalResponseDto> createRental(
            @RequestBody RentalRequestDto request, Authentication authentication) {

        Long id = (Long) authentication.getPrincipal();
        RentalResponseDto response = rentalService.createRental(request, id);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RentalResponseDto>> getAllUserRentals(
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        List<RentalResponseDto> response = rentalService.getAllRentals(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalResponseDto> getRentalById(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        RentalResponseDto response = rentalService.getRentalById(id, userId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RentalResponseDto> cancelRental(
            @PathVariable Long id, Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        RentalResponseDto response = rentalService.cancelRental(id, userId);

        return ResponseEntity.ok(response);
    }
}
