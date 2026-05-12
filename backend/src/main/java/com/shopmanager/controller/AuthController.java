package com.shopmanager.controller;

import com.shopmanager.dto.request.AuthRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.service.impl.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.AuthResponse>> register(
            @Valid @RequestBody AuthRequest.Register request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Registered successfully", authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.AuthResponse>> login(
            @Valid @RequestBody AuthRequest.Login request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Login successful", authService.login(request)));
    }
}
