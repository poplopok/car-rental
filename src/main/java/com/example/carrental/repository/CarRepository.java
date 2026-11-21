package com.example.carrental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.carrental.entity.Car;

public interface CarRepository extends JpaRepository<Car, Long> {
    @Query("SELECT c FROM Car c JOIN FETCH c.category")
    List<Car> findAllWithCategory();
}
