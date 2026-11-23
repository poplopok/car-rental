package com.example.carrental.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.response.CarResponseDto;
import com.example.carrental.service.CarService;

@RestController
@RequestMapping("/cars")
public class CarController {

    private final CarService carService;

    @Autowired
    public CarController(CarService carService) {
        this.carService = carService;
    }

    @GetMapping
    public ResponseEntity<List<CarResponseDto>> getAllCars(
            Authentication authentication) {
        List<CarResponseDto> carResponseDtos;

        if (authentication == null) {
            carResponseDtos = carService.getAllAvailableCars();
            System.out.println(authentication);

        } else {
            System.out.println(authentication);
            Long userId = (Long) authentication.getPrincipal();
            carResponseDtos = carService.getAllAvailableCars(userId);
        }

        return ResponseEntity.ok(carResponseDtos);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<CarResponseDto>> getAllCars() {
        List<CarResponseDto> carResponseDtos = carService.getAllCars();

        return ResponseEntity.ok(carResponseDtos);

    }

    @GetMapping("/{id}")
    public ResponseEntity<CarResponseDto> findCarById(@PathVariable Long id) {
        CarResponseDto response = carService.findCarById(id);

        return ResponseEntity.ok(response);
    }

}
