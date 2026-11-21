
package com.example.carrental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.carrental.enums.RentalStatus;

public class RentalResponseDto {

    private Long id;
    private CarSummaryDto car;
    private RentalStatus status;
    private BigDecimal pricePerDay;
    private BigDecimal totalPrice;
    private LocalDateTime startTime;
    private LocalDateTime plannedEndTime;
    private LocalDateTime actualEndTime;

    public RentalResponseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CarSummaryDto getCar() {
        return car;
    }

    public void setCar(CarSummaryDto car) {
        this.car = car;
    }

    public RentalStatus getStatus() {
        return status;
    }

    public void setStatus(RentalStatus status) {
        this.status = status;
    }

    public BigDecimal getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(BigDecimal pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getPlannedEndTime() {
        return plannedEndTime;
    }

    public void setPlannedEndTime(LocalDateTime plannedEndTime) {
        this.plannedEndTime = plannedEndTime;
    }

    public LocalDateTime getActualEndTime() {
        return actualEndTime;
    }

    public void setActualEndTime(LocalDateTime actualEndTime) {
        this.actualEndTime = actualEndTime;
    }
}
