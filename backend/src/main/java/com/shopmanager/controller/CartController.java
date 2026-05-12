package com.shopmanager.controller;

import com.shopmanager.dto.request.CartRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.service.impl.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.CartResponse>> getCart(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(cartService.getCart(user.getUsername())));
    }

    @PostMapping("/items")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.CartResponse>> addItem(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CartRequest.AddItem request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Item added to cart",
                cartService.addItem(user.getUsername(), request)));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.CartResponse>> updateItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long itemId,
            @Valid @RequestBody CartRequest.UpdateItem request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Cart updated",
                cartService.updateItem(user.getUsername(), itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.CartResponse>> removeItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Item removed",
                cartService.removeItem(user.getUsername(), itemId)));
    }
}
