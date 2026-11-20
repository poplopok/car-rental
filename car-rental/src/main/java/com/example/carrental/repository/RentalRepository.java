package com.example.carrental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Rental;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    public List<Rental> findAllByUserId(Long userId);

    public Optional<Rental> findByIdAndUserId(Long rentalId, Long userId);
}
