
package com.example.carrental.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.carrental.dto.request.PaymentRequestDto;
import com.example.carrental.dto.response.PaymentResponseDto;
import com.example.carrental.entity.Payment;
import com.example.carrental.entity.Rental;
import com.example.carrental.enums.PaymentStatus;
import com.example.carrental.repository.PaymentRepository;
import com.example.carrental.repository.RentalRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RentalRepository rentalRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            RentalRepository rentalRepository) {
        this.paymentRepository = paymentRepository;
        this.rentalRepository = rentalRepository;
    }

    public PaymentResponseDto createPayment(Long rentalId, PaymentRequestDto request) {

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        Payment payment = new Payment();

        payment.setRental(rental);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setAmount(rental.getTotalPrice());
        payment.setStatus(PaymentStatus.PENDING);

        Payment savedPayment = paymentRepository.save(payment);

        return convertToPaymentResponseDto(savedPayment);
    }

    public PaymentResponseDto getPaymentById(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        return convertToPaymentResponseDto(payment);
    }

    public List<PaymentResponseDto> getPaymentsByRentalId(Long rentalId) {

        List<Payment> payments = paymentRepository.findAllByRentalId(rentalId);

        return payments.stream()
                .map(this::convertToPaymentResponseDto)
                .toList();
    }

    private PaymentResponseDto convertToPaymentResponseDto(Payment payment) {

        PaymentResponseDto dto = new PaymentResponseDto();

        dto.setId(payment.getId());
        dto.setRentalId(payment.getRental().getId());
        dto.setStatus(payment.getStatus());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setAmount(payment.getAmount());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setCompletedAt(payment.getCompletedAt());

        return dto;
    }
}
