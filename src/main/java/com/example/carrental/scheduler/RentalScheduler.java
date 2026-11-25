package com.example.carrental.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.carrental.service.RentalService;

@Component
public class RentalScheduler {

    private final RentalService rentalService;

    public RentalScheduler(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @Scheduled(fixedRate = 60000)
    public void completeExpiredRentals() {
        rentalService.completeExpiredRentals();
    }

    @Scheduled(fixedRate = 60000)
    public void processPendingRentals() {
        rentalService.processPendingRentals();
    }
}
