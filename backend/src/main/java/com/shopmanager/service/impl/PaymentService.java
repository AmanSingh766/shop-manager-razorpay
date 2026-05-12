package com.shopmanager.service.impl;

//import com.razorpay.*;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.shopmanager.dto.request.OrderRequest;
import com.shopmanager.dto.request.PaymentVerifyRequest;
import com.shopmanager.dto.response.ResponseDTOs;
import com.shopmanager.entity.*;
import com.shopmanager.exception.BadRequestException;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final CartService cartService;

    @Value("${razorpay.api.key}")
    private String razorpayKeyId;
    @Value("${razorpay.api.secret}")
    private String razorpayKeySecret;
    @Value("${razorpay.currency:INR}")
    private String currency;

    @Transactional
    public ResponseDTOs.RazorpayOrderResponse createOrder(String username, OrderRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Cart cart = cartService.getOrCreateCart(username);
        if (cart.getCartItems().isEmpty()) throw new BadRequestException("Cart is empty");
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem ci : cart.getCartItems()) {
            Product p = productRepository.findById(ci.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", ci.getProduct().getId()));
            if (!p.isEnabled()) throw new BadRequestException("Product is not available");
            totalAmount = totalAmount.add(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem ci : cart.getCartItems()) {
            Product p = productRepository.findById(ci.getProduct().getId()).orElseThrow();
            BigDecimal sub = p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            orderItems.add(OrderItem.builder().product(p).quantity(ci.getQuantity())
                .priceAtOrder(p.getPrice()).subtotal(sub).build());
        }
        Order order = Order.builder().user(user).totalAmount(totalAmount)
            .status(Order.OrderStatus.AWAITING_PAYMENT).shippingAddress(request.getShippingAddress()).build();
        order = orderRepository.save(order);
        final Order so = order;
        orderItems.forEach(i -> i.setOrder(so));
        order.setOrderItems(orderItems);
        order = orderRepository.save(order);
        String rzpOrderId;
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject req = new JSONObject();
            req.put("amount", totalAmount.multiply(BigDecimal.valueOf(100)).intValue());
            req.put("currency", currency);
            req.put("receipt", "order_" + order.getId());
            req.put("payment_capture", 1);
            com.razorpay.Order rzpOrder = client.orders.create(req);
            rzpOrderId = rzpOrder.get("id");
        } catch (RazorpayException e) {
            order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
            throw new BadRequestException("Payment gateway error: " + e.getMessage());
        }
        Payment payment = Payment.builder().order(order).razorpayOrderId(rzpOrderId)
            .amount(totalAmount).status(Payment.PaymentStatus.CREATED).build();
        paymentRepository.save(payment);
        return ResponseDTOs.RazorpayOrderResponse.builder().orderId(order.getId())
            .razorpayOrderId(rzpOrderId).amount(totalAmount).currency(currency).keyId(razorpayKeyId).build();
    }

    @Transactional
    public ResponseDTOs.OrderResponse verifyAndProcess(String username, PaymentVerifyRequest req) {
        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        Order order = payment.getOrder();
        if (!order.getUser().getUsername().equals(username))
            throw new BadRequestException("Order does not belong to this user");
        if (!verifySignature(req.getRazorpayOrderId(), req.getRazorpayPaymentId(), req.getRazorpaySignature())) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            paymentRepository.save(payment);
            order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
            throw new BadRequestException("Payment verification failed: invalid signature");
        }
        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        List<String> outOfStock = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            Product p = productRepository.findById(item.getProduct().getId()).orElseThrow();
            if (p.getQuantity() < item.getQuantity())
                outOfStock.add(p.getName() + " (need: " + item.getQuantity() + ", have: " + p.getQuantity() + ")");
        }
        if (!outOfStock.isEmpty()) {
            String reason = "Out of stock: " + String.join(", ", outOfStock);
            String refundId = issueRefund(req.getRazorpayPaymentId(), payment.getAmount(), order.getId());
            payment.setStatus(refundId != null ? Payment.PaymentStatus.REFUNDED : Payment.PaymentStatus.REFUND_FAILED);
            if (refundId != null) payment.setRazorpayRefundId(refundId);
            payment.setFailureReason(reason + (refundId == null ? " | Refund failed - contact support" : ""));
            order.setStatus(Order.OrderStatus.OUT_OF_STOCK);
            paymentRepository.save(payment);
            orderRepository.save(order);
            return toOrderResponse(order, payment);
        }
        for (OrderItem item : order.getOrderItems()) {
            Product p = productRepository.findById(item.getProduct().getId()).orElseThrow();
            p.setQuantity(p.getQuantity() - item.getQuantity());
            productRepository.save(p);
        }
        payment.setStatus(Payment.PaymentStatus.PAID);
        paymentRepository.save(payment);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order = orderRepository.save(order);
        Cart cart = cartService.getOrCreateCart(username);
        cartService.clearCart(cart);
        return toOrderResponse(order, payment);
    }

    @Transactional
    public void handlePaymentFailed(String rzpOrderId, String reason) {
        paymentRepository.findByRazorpayOrderId(rzpOrderId).ifPresent(p -> {
            p.setStatus(Payment.PaymentStatus.FAILED);
            p.setFailureReason(reason);
            paymentRepository.save(p);
            Order o = p.getOrder();
            o.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            orderRepository.save(o);
        });
    }

    private String issueRefund(String paymentId, BigDecimal amount, Long orderId) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject refReq = new JSONObject();
            refReq.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            refReq.put("speed", "optimum");
            refReq.put("notes", new JSONObject().put("reason", "Out of stock for order " + orderId));
            com.razorpay.Refund refund = client.payments.refund(paymentId, refReq);
            log.info("Refund issued: {} for payment {}", refund.get("id"), paymentId);
            return refund.get("id");
        } catch (RazorpayException e) {
            log.error("Refund failed for {}: {}", paymentId, e.getMessage());
            return null;
        }
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal((orderId + "|" + paymentId).getBytes());
            return HexFormat.of().formatHex(hash).equals(signature);
        } catch (Exception e) { return false; }
    }

    public ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> getUserOrders(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Page<Order> orders = orderRepository.findByUserId(user.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPagedResponse(orders);
    }

    public ResponseDTOs.OrderResponse getOrder(String username, Long orderId) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!order.getUser().getId().equals(user.getId())) throw new ResourceNotFoundException("Order", orderId);
        return toOrderResponse(order, paymentRepository.findByOrderId(orderId).orElse(null));
    }

    public ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> getAllOrders(int page, int size) {
        return toPagedResponse(orderRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @Transactional
    public ResponseDTOs.OrderResponse updateStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        try { order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase())); }
        catch (IllegalArgumentException e) { throw new BadRequestException("Invalid status: " + status); }
        return toOrderResponse(orderRepository.save(order), paymentRepository.findByOrderId(orderId).orElse(null));
    }

    private ResponseDTOs.OrderResponse toOrderResponse(Order order, Payment payment) {
        List<ResponseDTOs.OrderItemResponse> items = order.getOrderItems().stream().map(item ->
            ResponseDTOs.OrderItemResponse.builder().id(item.getId())
                .productId(item.getProduct().getId()).productName(item.getProduct().getName())
                .quantity(item.getQuantity()).priceAtOrder(item.getPriceAtOrder()).subtotal(item.getSubtotal()).build()
        ).toList();
        ResponseDTOs.PaymentResponse pr = null;
        if (payment != null) pr = ResponseDTOs.PaymentResponse.builder().id(payment.getId())
            .razorpayOrderId(payment.getRazorpayOrderId()).razorpayPaymentId(payment.getRazorpayPaymentId())
            .amount(payment.getAmount()).status(payment.getStatus().name())
            .failureReason(payment.getFailureReason()).build();
        return ResponseDTOs.OrderResponse.builder().id(order.getId()).items(items)
            .totalAmount(order.getTotalAmount()).status(order.getStatus().name())
            .shippingAddress(order.getShippingAddress()).payment(pr)
            .createdAt(order.getCreatedAt()).updatedAt(order.getUpdatedAt()).build();
    }

    private ResponseDTOs.PagedResponse<ResponseDTOs.OrderResponse> toPagedResponse(Page<Order> pg) {
        return ResponseDTOs.PagedResponse.<ResponseDTOs.OrderResponse>builder()
            .content(pg.getContent().stream().map(o -> toOrderResponse(o, paymentRepository.findByOrderId(o.getId()).orElse(null))).toList())
            .page(pg.getNumber()).size(pg.getSize()).totalElements(pg.getTotalElements())
            .totalPages(pg.getTotalPages()).last(pg.isLast()).build();
    }
}