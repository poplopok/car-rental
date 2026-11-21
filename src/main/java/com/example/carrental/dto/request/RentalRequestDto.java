
package com.example.carrental.dto.request;

import java.time.LocalDateTime;

public class RentalRequestDto {

    private Long userId;
    private Long carId;
    private LocalDateTime startTime;
    private LocalDateTime plannedEndTime;

    public RentalRequestDto() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCarId() {
        return carId;
    }

    public void setCarId(Long carId) {
        this.carId = carId;
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
}
