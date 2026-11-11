package com.example.carrental.entity;

import java.math.BigDecimal;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "category")
    private List<Car> cars;

    @Column(nullable = false)
    private String name;

    private BigDecimal priceMultiplier;
}