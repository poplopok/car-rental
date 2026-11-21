package com.example.carrental.mapper;

import org.springframework.stereotype.Component;

import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.entity.Rental;

@Component
public class RentalMapper {
    CarMapper carMapper;

    public RentalMapper(CarMapper carMapper) {
        this.carMapper = carMapper;
    }

    public RentalResponseDto convertToRentalResponseDto(Rental rental) {

        RentalResponseDto dto = new RentalResponseDto();

        dto.setId(rental.getId());
        dto.setCar(carMapper.convertToCarSummaryDto(rental.getCar()));
        dto.setStatus(rental.getStatus());
        dto.setPricePerDay(rental.getPricePerDay());
        dto.setTotalPrice(rental.getTotalPrice());
        dto.setStartTime(rental.getStartTime());
        dto.setPlannedEndTime(rental.getPlannedEndTime());
        dto.setActualEndTime(rental.getEndTime());

        return dto;
    }
}
