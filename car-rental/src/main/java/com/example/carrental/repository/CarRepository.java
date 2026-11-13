package com.example.carrental.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Car;

public interface CarRepository extends JpaRepository<Car, Long> {

}
