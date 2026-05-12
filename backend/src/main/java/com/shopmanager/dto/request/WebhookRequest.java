package com.shopmanager.dto.request;
import lombok.Data;
@Data
public class WebhookRequest {
    private String event;
    private Payload payload;
    @Data
    public static class Payload {
        private PaymentEntity payment;
    }
    @Data
    public static class PaymentEntity {
        private Entity entity;
    }
    @Data
    public static class Entity {
        private String id;
        private String order_id;
        private String description;
        private String error_description;
    }
}