package com.example.carrental.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.carrental.dto.response.CarResponseDto;
import com.example.carrental.entity.Car;
import com.example.carrental.repository.CarRepository;

@Service
public class CarService {
    private final CarRepository carRepository;

    public CarService(CarRepository carRepository) {
        this.carRepository = carRepository;
    }

    public List<CarResponseDto> getAllCars(Long userId) {
        List<CarResponseDto> cars = carRepository.findAllAvailableCarsWithCategory(userId).stream()
                .map(this::convertToCarResponseDto)
                .toList();
        return cars;
    }

    public List<CarResponseDto> getAllCars() {
        List<CarResponseDto> cars = carRepository.findAllWithCategory().stream()
                .map(this::convertToCarResponseDto)
                .toList();
        return cars;
    }

    public CarResponseDto findCarById(Long id) {
        CarResponseDto car = convertToCarResponseDto(carRepository.findById(id).orElseThrow());

        return car;
    }

    private CarResponseDto convertToCarResponseDto(Car car) {
        CarResponseDto dto = new CarResponseDto();
        dto.setId(car.getId());
        dto.setCategoryId(car.getCategory().getId());
        dto.setCategoryName(car.getCategory().getName());
        dto.setBrand(car.getBrand());
        dto.setModel(car.getModel());
        dto.setYear(car.getYear());
        dto.setPricePerDay(car.getPricePerDay());
        dto.setLatitude(car.getLatitude());
        dto.setLongitude(car.getLongitude());
        dto.setImageUrl(car.getImageUrl());
        return dto;
    }

}
