package com.example.carrental.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.carrental.dto.response.CategoryResponseDto;
import com.example.carrental.entity.Category;
import com.example.carrental.exception.CategoryNotFoundException;

import com.example.carrental.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponseDto> getAllCategories() {
        List<CategoryResponseDto> categoryResponseDtos = categoryRepository.findAll().stream()
                .map(this::convertToCategoryResponseDto).toList();

        if (categoryResponseDtos.isEmpty()) {
            throw new CategoryNotFoundException("Category not found");
        }
        return categoryResponseDtos;
    }

    public CategoryResponseDto findCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));

        return convertToCategoryResponseDto(category);
    }

    private CategoryResponseDto convertToCategoryResponseDto(Category category) {
        CategoryResponseDto categoryResponseDto = new CategoryResponseDto();

        categoryResponseDto.setId(category.getId());
        categoryResponseDto.setName(category.getName());
        categoryResponseDto.setPriceMultiplier(category.getPriceMultiplier());

        return categoryResponseDto;
    }

}
