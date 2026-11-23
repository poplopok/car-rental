package com.example.carrental.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.carrental.dto.response.CarResponseDto;

import com.example.carrental.mapper.CarMapper;
import com.example.carrental.repository.CarRepository;

@Service
public class CarService {
    private final CarRepository carRepository;
    private final CarMapper carMapper;

    public CarService(CarRepository carRepository, CarMapper carMapper) {
        this.carRepository = carRepository;
        this.carMapper = carMapper;
    }

    public List<CarResponseDto> getAllAvailableCars(Long userId) {
        List<CarResponseDto> cars = carRepository.findAllAvailableCarsWithCategory(userId).stream()
                .map(this.carMapper::convertToCarResponseDto)
                .toList();
        return cars;
    }

    public List<CarResponseDto> getAllAvailableCars() {
        List<CarResponseDto> cars = carRepository.findAllAvailableCarsWithCategory().stream()
                .map(this.carMapper::convertToCarResponseDto)
                .toList();
        return cars;
    }

    public List<CarResponseDto> getAllCars() {
        List<CarResponseDto> cars = carRepository.findAllWithCategory().stream()
                .map(this.carMapper::convertToCarResponseDto)
                .toList();
        return cars;
    }

    public CarResponseDto findCarById(Long id) {
        CarResponseDto car = carMapper.convertToCarResponseDto(carRepository.findCarWithCategory(id).orElseThrow());

        return car;
    }

}
