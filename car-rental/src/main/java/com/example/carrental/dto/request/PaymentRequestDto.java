
package com.example.carrental.dto.request;

import com.example.carrental.enums.PaymentMethod;

public class PaymentRequestDto {

    private PaymentMethod paymentMethod;

    public PaymentRequestDto() {
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
