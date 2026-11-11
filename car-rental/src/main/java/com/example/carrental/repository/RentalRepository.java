package com.example.carrental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Rental;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    public List<Rental> findAllByUserId(Long userId);

}
