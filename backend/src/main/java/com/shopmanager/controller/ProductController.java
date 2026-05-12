package com.shopmanager.controller;

import com.shopmanager.dto.request.ProductRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.service.impl.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // --- PUBLIC ENDPOINTS ---

    @GetMapping("/api/products")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search) {

        ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse> result =
                (search != null && !search.isBlank())
                        ? productService.searchProducts(search, page, size)
                        : productService.getAllProducts(page, size);

        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(result));
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.ProductResponse>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(productService.getProduct(id)));
    }

    // --- ADMIN ENDPOINTS ---

    @GetMapping("/api/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse>>> getAllAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success(productService.getAllProductsAdmin(page, size)));
    }

    @PostMapping("/api/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest.Create request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Product created", productService.createProduct(request)));
    }

    @PatchMapping("/api/admin/products/{id}/price")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.ProductResponse>> updatePrice(
            @PathVariable Long id, @Valid @RequestBody ProductRequest.UpdatePrice request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Price updated", productService.updatePrice(id, request)));
    }

    @PatchMapping("/api/admin/products/{id}/quantity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.ProductResponse>> updateQuantity(
            @PathVariable Long id, @Valid @RequestBody ProductRequest.UpdateQuantity request) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Quantity updated", productService.updateQuantity(id, request)));
    }

    @PatchMapping("/api/admin/products/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTOs.ApiResponse<ResponseDTOs.ProductResponse>> toggleProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseDTOs.ApiResponse.success("Status toggled", productService.toggleEnabled(id)));
    }
}
