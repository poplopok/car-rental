package com.example.carrental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Payment;

public interface PaymentsRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByRentalUserId(Long userId);
}
