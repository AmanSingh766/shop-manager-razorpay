package com.shopmanager.service.impl;

import com.shopmanager.dto.request.CartRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.entity.*;
import com.shopmanager.exception.BadRequestException;
import com.shopmanager.exception.InsufficientInventoryException;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.CartItemRepository;
import com.shopmanager.repository.CartRepository;
import com.shopmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public ResponseDTOs.CartResponse getCart(String username) {
        Cart cart = getOrCreateCart(username);
        return toResponse(cart);
    }

    @Transactional
    public ResponseDTOs.CartResponse addItem(String username, CartRequest.AddItem request) {
        Cart cart = getOrCreateCart(username);
        Product product = productService.findEnabledById(request.getProductId());

        if (product.getQuantity() < request.getQuantity()) {
            throw new InsufficientInventoryException(product.getName(), request.getQuantity(), product.getQuantity());
        }

        // Check if item already exists in cart
        CartItem existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        if (existing != null) {
            int newQty = existing.getQuantity() + request.getQuantity();
            if (product.getQuantity() < newQty) {
                throw new InsufficientInventoryException(product.getName(), newQty, product.getQuantity());
            }
            existing.setQuantity(newQty);
            cartItemRepository.save(existing);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .priceAtAddition(product.getPrice())
                    .build();
            cart.getCartItems().add(cartItemRepository.save(item));
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public ResponseDTOs.CartResponse updateItem(String username, Long itemId, CartRequest.UpdateItem request) {
        Cart cart = getOrCreateCart(username);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this user");
        }

        if (item.getProduct().getQuantity() < request.getQuantity()) {
            throw new InsufficientInventoryException(
                    item.getProduct().getName(), request.getQuantity(), item.getProduct().getQuantity());
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        return toResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    @Transactional
    public ResponseDTOs.CartResponse removeItem(String username, Long itemId) {
        Cart cart = getOrCreateCart(username);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this user");
        }

        cart.getCartItems().remove(item);
        cartItemRepository.delete(item);
        return toResponse(cart);
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getCartItems().clear();
        cartRepository.save(cart);
    }

    public Cart getOrCreateCart(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart cart = Cart.builder().user(user).build();
                    return cartRepository.save(cart);
                });
    }

    private ResponseDTOs.CartResponse toResponse(Cart cart) {
        List<ResponseDTOs.CartItemResponse> items = cart.getCartItems().stream().map(item ->
                ResponseDTOs.CartItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImageUrl(item.getProduct().getImageUrl())
                        .priceAtAddition(item.getPriceAtAddition())
                        .quantity(item.getQuantity())
                        .subtotal(item.getPriceAtAddition().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build()
        ).toList();

        BigDecimal total = items.stream()
                .map(ResponseDTOs.CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseDTOs.CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalAmount(total)
                .totalItems(items.size())
                .build();
    }
}
