package com.example.carrental.mapper;

import org.springframework.stereotype.Component;

import com.example.carrental.dto.response.CarResponseDto;
import com.example.carrental.dto.response.CarSummaryDto;
import com.example.carrental.entity.Car;

@Component
public class CarMapper {
    public CarSummaryDto convertToCarSummaryDto(Car car) {
        CarSummaryDto dto = new CarSummaryDto();

        dto.setId(car.getId());
        dto.setBrand(car.getBrand());
        dto.setModel(car.getModel());
        dto.setYear(car.getYear());
        dto.setStatus(car.getStatus());
        return dto;
    }

    public CarResponseDto convertToCarResponseDto(Car car) {
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
        dto.setStatus(car.getStatus());
        return dto;
    }
}
