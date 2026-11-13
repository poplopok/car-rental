
package com.example.carrental.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.carrental.dto.request.RentalRequestDto;
import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.entity.Car;
import com.example.carrental.entity.Rental;
import com.example.carrental.entity.User;
import com.example.carrental.enums.RentalStatus;
import com.example.carrental.mapper.CarMapper;
import com.example.carrental.repository.CarRepository;
import com.example.carrental.repository.RentalRepository;
import com.example.carrental.repository.UserRepository;

@Service
public class RentalService {

    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final CarMapper carmapper;

    public RentalService(
            RentalRepository rentalRepository,
            UserRepository userRepository,
            CarRepository carRepository,
            CarMapper carmapper) {
        this.rentalRepository = rentalRepository;
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.carmapper = carmapper;

    }

    public RentalResponseDto createRental(RentalRequestDto request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("Car not found"));

        Rental rental = new Rental();

        rental.setUser(user);
        rental.setCar(car);
        rental.setStartTime(request.getStartTime());
        rental.setPlannedEndTime(request.getPlannedEndTime());
        rental.setStatus(RentalStatus.PENDING);

        Rental savedRental = rentalRepository.save(rental);

        return convertToRentalResponseDto(savedRental);
    }

    public List<RentalResponseDto> getAllRentals(Long userId) {

        List<Rental> rentals;

        if (userId == null) {
            rentals = rentalRepository.findAll();
        } else {
            rentals = rentalRepository.findAllByUserId(userId);
        }

        return rentals.stream()
                .map(this::convertToRentalResponseDto)
                .toList();
    }

    public RentalResponseDto getRentalById(Long id) {

        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        return convertToRentalResponseDto(rental);
    }

    public RentalResponseDto cancelRental(Long id) {

        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        rental.setStatus(RentalStatus.CANCELLED);

        Rental savedRental = rentalRepository.save(rental);

        return convertToRentalResponseDto(savedRental);
    }

    private RentalResponseDto convertToRentalResponseDto(Rental rental) {

        RentalResponseDto dto = new RentalResponseDto();

        dto.setId(rental.getId());
        dto.setCar(carmapper.convertToCarSummaryDto(rental.getCar()));
        dto.setStatus(rental.getStatus());
        dto.setPricePerDay(rental.getPricePerDay());
        dto.setTotalPrice(rental.getTotalPrice());
        dto.setStartTime(rental.getStartTime());
        dto.setPlannedEndTime(rental.getPlannedEndTime());
        dto.setActualEndTime(rental.getEndTime());

        return dto;
    }

}
