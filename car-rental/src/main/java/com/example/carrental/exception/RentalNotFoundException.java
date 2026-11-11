package com.example.carrental.exception;

public class RentalNotFoundException extends RuntimeException {

    public RentalNotFoundException(String message) {
        super(message);
    }
}
