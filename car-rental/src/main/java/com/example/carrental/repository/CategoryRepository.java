package com.example.carrental.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}
