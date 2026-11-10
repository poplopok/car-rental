package com.example.carrental.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.carrental.enums.RentalStatus;

import jakarta.persistence.*;

@Entity
@Table(name = "rental")
public class Rental {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "car_id")
    private Car car;

    @OneToMany(mappedBy = "rental")
    private List<Payment> payments;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RentalStatus status;

    @Column(nullable = false)
    private BigDecimal pricePerDay;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime plannedEndTime;

    private LocalDateTime endTime;

}