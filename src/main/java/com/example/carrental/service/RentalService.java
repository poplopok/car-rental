
package com.example.carrental.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.carrental.dto.request.RentalRequestDto;
import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.entity.Car;
import com.example.carrental.entity.Rental;
import com.example.carrental.entity.User;
import com.example.carrental.enums.RentalStatus;
import com.example.carrental.exception.ForbiddenException;
import com.example.carrental.mapper.RentalMapper;
import com.example.carrental.repository.CarRepository;
import com.example.carrental.repository.RentalRepository;
import com.example.carrental.repository.UserRepository;

@Service
public class RentalService {

    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final RentalMapper rentalMapper;

    public RentalService(
            RentalRepository rentalRepository,
            UserRepository userRepository,
            CarRepository carRepository,
            RentalMapper rentalMapper) {
        this.rentalRepository = rentalRepository;
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.rentalMapper = rentalMapper;

    }

    public RentalResponseDto createRental(RentalRequestDto request, Long userId) {

        if (!userId.equals(request.getUserId())) {
            throw new ForbiddenException("Access denied");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("Car not found"));

        BigDecimal pricePerDay = car.getPricePerDay();

        long hours = Duration.between(
                request.getStartTime(),
                request.getPlannedEndTime()).toHours();

        long days = (long) Math.ceil(hours / 24.0);

        if (days < 1) {
            days = 1;
        }

        BigDecimal totalPrice = pricePerDay.multiply(BigDecimal.valueOf(days));

        Rental rental = new Rental();

        rental.setUser(user);
        rental.setCar(car);
        rental.setPricePerDay(pricePerDay);
        rental.setTotalPrice(totalPrice);
        rental.setStartTime(request.getStartTime());
        rental.setPlannedEndTime(request.getPlannedEndTime());
        rental.setStatus(RentalStatus.PENDING);

        Rental savedRental = rentalRepository.save(rental);

        return rentalMapper.convertToRentalResponseDto(savedRental);
    }

    public List<RentalResponseDto> getAllRentals(Long userId) {

        List<Rental> rentals;

        if (userId == null) {
            rentals = rentalRepository.findAll();
        } else {
            rentals = rentalRepository.findAllByUserId(userId);
        }

        return rentals.stream()
                .map(this.rentalMapper::convertToRentalResponseDto)
                .toList();
    }

    public RentalResponseDto getRentalById(Long id, Long userId) {

        Rental rental = rentalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        return rentalMapper.convertToRentalResponseDto(rental);
    }

    public RentalResponseDto cancelRental(Long id, Long userId) {

        Rental rental = rentalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        rental.setStatus(RentalStatus.CANCELLED);

        Rental savedRental = rentalRepository.save(rental);

        return rentalMapper.convertToRentalResponseDto(savedRental);
    }

}
