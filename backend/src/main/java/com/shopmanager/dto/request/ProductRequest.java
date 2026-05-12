package com.shopmanager.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

public class ProductRequest {

    @Data
    public static class Create {
        @NotBlank(message = "Product name is required")
        @Size(max = 200)
        private String name;

        @Size(max = 1000)
        private String description;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal price;

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        private Integer quantity;

        private String category;
        private String imageUrl;
    }

    @Data
    public static class UpdatePrice {
        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal price;
    }

    @Data
    public static class UpdateQuantity {
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        private Integer quantity;
    }
}
