package com.shopmanager.exception;

public class InsufficientInventoryException extends RuntimeException {
    public InsufficientInventoryException(String productName, int requested, int available) {
        super(String.format("Insufficient inventory for '%s'. Requested: %d, Available: %d",
                productName, requested, available));
    }
}
