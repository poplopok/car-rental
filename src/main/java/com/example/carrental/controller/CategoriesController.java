package com.example.carrental.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.carrental.dto.response.CategoryResponseDto;
import com.example.carrental.service.CategoryService;

@RestController
@RequestMapping("/categories")
public class CategoriesController {

    private final CategoryService categoryService;

    @Autowired
    public CategoriesController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {
        List<CategoryResponseDto> categoryResponseDtos = categoryService.getAllCategories();

        return ResponseEntity.ok(categoryResponseDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDto> findCategoryById(@PathVariable Long id) {
        CategoryResponseDto response = categoryService.findCategoryById(id);

        return ResponseEntity.ok(response);
    }

}
