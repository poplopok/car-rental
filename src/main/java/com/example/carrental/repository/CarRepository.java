package com.example.carrental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.carrental.entity.Car;

public interface CarRepository extends JpaRepository<Car, Long> {
    @Query("""
                SELECT c
                FROM Car c
                JOIN FETCH c.category
                LEFT JOIN Rental r
                    ON r.car = c
                    AND (r.status = 'PENDING' OR r.status = 'ACTIVE')
                    AND r.user.id <> :userId
                WHERE r.id IS NULL
            """)
    List<Car> findAllAvailableCarsWithCategory(@Param("userId") Long userId);

    @Query("""
                SELECT c
                FROM Car c
                JOIN FETCH c.category
                LEFT JOIN Rental r
                    ON r.car = c
                    AND (r.status = 'PENDING' OR r.status = 'ACTIVE')
                WHERE r.id IS NULL
            """)
    List<Car> findAllAvailableCarsWithCategory();

    @Query("SELECT c FROM Car c JOIN FETCH c.category")
    List<Car> findAllWithCategory();

    @Query("SELECT c FROM Car c JOIN FETCH c.category WHERE c.id = :id")
    Optional<Car> findCarWithCategory(@Param("id") Long id);

}
