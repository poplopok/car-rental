package com.example.carrental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.carrental.dto.request.UserRequestDto;
import com.example.carrental.dto.response.PaymentResponseDto;
import com.example.carrental.dto.response.RentalResponseDto;
import com.example.carrental.dto.response.UserResponseDto;
import com.example.carrental.entity.Payment;
import com.example.carrental.entity.Rental;
import com.example.carrental.entity.User;
import com.example.carrental.exception.PaymentNotFoundException;
import com.example.carrental.exception.RentalNotFoundException;
import com.example.carrental.exception.UserAlreadyExistsException;
import com.example.carrental.exception.UserNotFoundException;
import com.example.carrental.mapper.CarMapper;
import com.example.carrental.repository.PaymentsRepository;
import com.example.carrental.repository.RentalRepository;
import com.example.carrental.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RentalRepository rentalRepository;
    private final PaymentsRepository paymentsRepository;
    private final CarMapper carmapper;

    @Autowired
    public UserService(UserRepository userRepository, RentalRepository rentalRepository,
            PaymentsRepository paymentsRepository, CarMapper carmapper) {
        this.userRepository = userRepository;
        this.rentalRepository = rentalRepository;
        this.paymentsRepository = paymentsRepository;
        this.carmapper = carmapper;
    }

    @Transactional
    public UserResponseDto createUser(UserRequestDto request) {
        User user = new User();
        user.setDateOfBirth(request.getDateOfBirth());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setUsername(request.getUsername());

        if (userRepository.existsByUsernameOrEmailOrPhone(user.getUsername(), user.getEmail(), user.getPhone())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        User savedUser = userRepository.save(user);

        UserResponseDto response = new UserResponseDto();

        response.setId(savedUser.getId());
        response.setDateOfBirth(savedUser.getDateOfBirth());
        response.setEmail(savedUser.getEmail());
        response.setFirstName(savedUser.getFirstName());
        response.setLastName(savedUser.getLastName());
        response.setPhone(savedUser.getPhone());
        response.setUsername(savedUser.getUsername());

        return response;
    }

    public UserResponseDto findUserById(Long id) {
        Optional<User> optionalResponseUser = userRepository.findById(id);

        if (optionalResponseUser.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }
        User foundUser = optionalResponseUser.get();

        UserResponseDto response = new UserResponseDto();
        response.setId(foundUser.getId());
        response.setDateOfBirth(foundUser.getDateOfBirth());
        response.setEmail(foundUser.getEmail());
        response.setFirstName(foundUser.getFirstName());
        response.setLastName(foundUser.getLastName());
        response.setPhone(foundUser.getPhone());
        response.setUsername(foundUser.getUsername());

        return response;
    }

    public String deleteUserById(Long id) {

        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found");
        }

        userRepository.deleteById(id);
        String message = "User deleted successfully";
        return message;
    }

    public List<RentalResponseDto> getRentalsById(Long id) {
        List<RentalResponseDto> rentalsResponseDtos = rentalRepository.findAllByUserId(id).stream()
                .map((rental) -> convertRentalToResponseDto(rental)).toList();
        if (rentalsResponseDtos.isEmpty()) {
            throw new RentalNotFoundException("Rentals not found");
        }
        return rentalsResponseDtos;
    }

    private RentalResponseDto convertRentalToResponseDto(Rental rental) {
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

    public List<PaymentResponseDto> getPaymentsById(Long id) {
        List<PaymentResponseDto> paymentResponseDtos = paymentsRepository.findAllByRentalUserId(id).stream()
                .map(this::convertPaymentToResponseDto).toList();

        if (paymentResponseDtos.isEmpty()) {
            throw new PaymentNotFoundException("Payments not found");
        }
        return paymentResponseDtos;
    }

    private PaymentResponseDto convertPaymentToResponseDto(Payment payment) {
        PaymentResponseDto dto = new PaymentResponseDto();

        dto.setId(payment.getId());
        dto.setRentalId(payment.getRental().getId());
        dto.setStatus(payment.getStatus());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setAmount(payment.getAmount());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setCompletedAt(payment.getCompletedAt());

        return dto;
    }

}
