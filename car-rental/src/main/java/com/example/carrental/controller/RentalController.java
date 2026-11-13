
package com.example.carrental.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            @RequestBody RentalRequestDto request) {

        RentalResponseDto response = rentalService.createRental(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RentalResponseDto>> getAllRentals(
            @RequestParam(required = false) Long userId) {

        List<RentalResponseDto> response = rentalService.getAllRentals(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalResponseDto> getRentalById(
            @PathVariable Long id) {

        RentalResponseDto response = rentalService.getRentalById(id);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RentalResponseDto> cancelRental(
            @PathVariable Long id) {

        RentalResponseDto response = rentalService.cancelRental(id);

        return ResponseEntity.ok(response);
    }
}
