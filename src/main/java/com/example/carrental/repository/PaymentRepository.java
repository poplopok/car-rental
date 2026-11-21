package com.example.carrental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByRentalId(Long rentalId);

    Optional<Payment> findByIdAndRentalUserId(Long id, Long userId);

}