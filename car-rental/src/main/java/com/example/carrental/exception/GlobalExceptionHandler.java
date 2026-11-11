package com.example.carrental.exception;

import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<String> response(UserAlreadyExistsException exception) {

        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }

}
