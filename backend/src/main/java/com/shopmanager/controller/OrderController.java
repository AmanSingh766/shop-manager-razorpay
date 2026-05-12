package com.shopmanager.controller;

import com.shopmanager.dto.request.OrderRequest;
import com.shopmanager.dto.request.PaymentVerifyRequest;
import com.shopmanager.dto.request.WebhookRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.service.impl.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class OrderController {
    private final PaymentService paymentService;

    @PostMapping("/api/orders/create")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.RazorpayOrderResponse>> createOrder(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Order created",
                paymentService.createOrder(user.getUsername(), request)));
    }

    @PostMapping("/api/orders/verify-payment")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.OrderResponse>> verifyPayment(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Payment processed",
                paymentService.verifyAndProcess(user.getUsername(), request)));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse>>> myOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(
                paymentService.getUserOrders(user.getUsername(), page, size)));
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.OrderResponse>> getOrder(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(
                paymentService.getOrder(user.getUsername(), id)));
    }

    @PostMapping("/api/webhook/razorpay")
    public ResponseEntity<Void> razorpayWebhook(@RequestBody WebhookRequest body) {
        if ("payment.failed".equals(body.getEvent()) && body.getPayload() != null
                && body.getPayload().getPayment() != null) {
            WebhookRequest.Entity entity = body.getPayload().getPayment().getEntity();
            if (entity != null && entity.getOrder_id() != null) {
                String reason = entity.getError_description() != null ? entity.getError_description() : "Payment failed";
                paymentService.handlePaymentFailed(entity.getOrder_id(), reason);
            }
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse>>> allOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(paymentService.getAllOrders(page, size)));
    }

    @PatchMapping("/api/admin/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.OrderResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Status updated",
                paymentService.updateStatus(id, status)));
    }
}