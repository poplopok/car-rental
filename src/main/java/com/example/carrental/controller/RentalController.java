
package com.example.carrental.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/my")
    public ResponseEntity<List<RentalResponseDto>> getMyRentals(
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        List<RentalResponseDto> response = rentalService.getAllRentalsByUserId(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my/{rentalId}")
    public ResponseEntity<RentalResponseDto> getMyRental(
            Authentication authentication, @PathVariable Long rentalId) {
        Long userId = (Long) authentication.getPrincipal();
        RentalResponseDto response = rentalService.getRentalByIdAndUserID(rentalId, userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<RentalResponseDto>> getRentalsByUserId(
            @RequestParam Long userId) {

        List<RentalResponseDto> response = rentalService.getAllRentalsByUserId(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<RentalResponseDto> getRentalById(
            @PathVariable Long id) {

        RentalResponseDto response = rentalService.getRentalById(id);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<RentalResponseDto> cancelRental(
            @PathVariable Long id) {

        RentalResponseDto response = rentalService.cancelRentalById(id);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/cancel/{rentalId}")
    public ResponseEntity<RentalResponseDto> cancelMyRental(
            @PathVariable Long rentalId, Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        RentalResponseDto response = rentalService.cancelMyRental(rentalId, userId);

        return ResponseEntity.ok(response);
    }
}
