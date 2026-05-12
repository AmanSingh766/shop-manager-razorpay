package com.shopmanager.service.impl;

import com.shopmanager.dto.request.OrderRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.entity.*;
import com.shopmanager.exception.BadRequestException;
import com.shopmanager.exception.InsufficientInventoryException;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.OrderRepository;
import com.shopmanager.repository.ProductRepository;
import com.shopmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    @Transactional
    public ResponseDTOs.OrderResponse placeOrder(String username, OrderRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Cart cart = cartService.getOrCreateCart(username);

        if (cart.getCartItems().isEmpty()) {
            throw new BadRequestException("Cannot place order with empty cart");
        }

        // Validate all items and reduce inventory atomically
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getCartItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", cartItem.getProduct().getId()));

            if (!product.isEnabled()) {
                throw new BadRequestException("Product '" + product.getName() + "' is no longer available");
            }

            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new InsufficientInventoryException(
                        product.getName(), cartItem.getQuantity(), product.getQuantity());
            }

            // Reduce inventory
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtOrder(product.getPrice())
                    .subtotal(subtotal)
                    .build());
        }

        // Create order
        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.AWAITING_PAYMENT)
                .shippingAddress(request.getShippingAddress())
                .build();

        order = orderRepository.save(order);

        final Order savedOrder = order;
        orderItems.forEach(item -> item.setOrder(savedOrder));
        order.setOrderItems(orderItems);
        order = orderRepository.save(order);

        // Clear cart after successful order
        cartService.clearCart(cart);

        return toResponse(order);
    }

    public ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> getUserOrders(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orders = orderRepository.findByUserId(user.getId(), pageable);
        return toPagedResponse(orders);
    }

    public ResponseDTOs.OrderResponse getOrder(String username, Long orderId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order", orderId);
        }
        return toResponse(order);
    }

    // Admin
    public ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return toPagedResponse(orderRepository.findAll(pageable));
    }

    @Transactional
    public ResponseDTOs.OrderResponse updateStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        try {
            order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status);
        }
        return toResponse(orderRepository.save(order));
    }

    private ResponseDTOs.OrderResponse toResponse(Order order) {
        List<ResponseDTOs.OrderItemResponse> items = order.getOrderItems().stream().map(item ->
                ResponseDTOs.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .priceAtOrder(item.getPriceAtOrder())
                        .subtotal(item.getSubtotal())
                        .build()
        ).toList();

        return ResponseDTOs.OrderResponse.builder()
                .id(order.getId())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> toPagedResponse(Page<Order> page) {
        return ResponseDTOs.PagedResponse.<ResponseDTOs.OrderResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
