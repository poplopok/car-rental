package com.example.carrental.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carrental.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    public boolean existsByUsernameOrEmailOrPhone(String username, String email, String phone);
}
