package com.example.carrental.mapper;

import org.springframework.stereotype.Component;

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

        return dto;
    }
}
