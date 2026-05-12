package com.shopmanager.service.impl;

import com.shopmanager.dto.request.ProductRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.entity.Product;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> products = productRepository.findByEnabledTrue(pageable);
        return toPagedResponse(products);
    }

    public ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> products = productRepository.searchProducts(keyword, pageable);
        return toPagedResponse(products);
    }

    public ResponseDTOs.ProductResponse getProduct(Long id) {
        Product product = findEnabledById(id);
        return toResponse(product);
    }

    // Admin operations
    @Transactional
    public ResponseDTOs.ProductResponse createProduct(ProductRequest.Create request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .enabled(true)
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ResponseDTOs.ProductResponse updatePrice(Long id, ProductRequest.UpdatePrice request) {
        Product product = findById(id);
        product.setPrice(request.getPrice());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ResponseDTOs.ProductResponse updateQuantity(Long id, ProductRequest.UpdateQuantity request) {
        Product product = findById(id);
        product.setQuantity(request.getQuantity());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ResponseDTOs.ProductResponse toggleEnabled(Long id) {
        Product product = findById(id);
        product.setEnabled(!product.isEnabled());
        return toResponse(productRepository.save(product));
    }

    public ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse> getAllProductsAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> products = productRepository.findAll(pageable);
        return toPagedResponse(products);
    }

    // Internal helpers
    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public Product findEnabledById(Long id) {
        Product product = findById(id);
        if (!product.isEnabled()) {
            throw new ResourceNotFoundException("Product", id);
        }
        return product;
    }

    private ResponseDTOs.ProductResponse toResponse(Product p) {
        return ResponseDTOs.ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .quantity(p.getQuantity())
                .category(p.getCategory())
                .imageUrl(p.getImageUrl())
                .enabled(p.isEnabled())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private ResponseDTOs.PagedResponse<ResponseDTOs.ProductResponse> toPagedResponse(Page<Product> page) {
        return ResponseDTOs.PagedResponse.<ResponseDTOs.ProductResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
