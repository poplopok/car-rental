package com.example.carrental.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Rental;
import com.example.carrental.enums.RentalStatus;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    public List<Rental> findAllByUserId(Long userId);

    public Optional<Rental> findByIdAndUserId(Long rentalId, Long userId);

    List<Rental> findAllByStatusAndPlannedEndTimeBefore(
            RentalStatus status,
            LocalDateTime date);

    List<Rental> findAllByStatus(RentalStatus status);
}
