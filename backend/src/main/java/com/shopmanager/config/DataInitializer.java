package com.shopmanager.config;

import com.shopmanager.entity.User;
import com.shopmanager.entity.Product;
import com.shopmanager.entity.Cart;
import com.shopmanager.repository.UserRepository;
import com.shopmanager.repository.ProductRepository;
import com.shopmanager.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedProducts();
    }

    private void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@shopmanager.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info(" Admin user created — username: admin / password: admin123");
        }

        if (!userRepository.existsByUsername("user1")) {
            User user = User.builder()
                    .username("user1")
                    .email("user1@example.com")
                    .password(passwordEncoder.encode("user123"))
                    .role(User.Role.ROLE_USER)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);
            Cart cart = Cart.builder().user(user).build();
            cartRepository.save(cart);
            log.info("Sample user created — username: user1 / password: user123");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            List<Product> products = List.of(
                Product.builder().name("Wireless Mouse").description("Ergonomic 2.4GHz wireless mouse")
                    .price(new BigDecimal("1299.00")).quantity(50).category("Electronics").enabled(true).build(),
                Product.builder().name("Mechanical Keyboard").description("RGB backlit TKL mechanical keyboard")
                    .price(new BigDecimal("3499.00")).quantity(30).category("Electronics").enabled(true).build(),
                Product.builder().name("USB-C Hub").description("7-in-1 USB-C hub with HDMI, USB 3.0, PD charging")
                    .price(new BigDecimal("2199.00")).quantity(25).category("Electronics").enabled(true).build(),
                Product.builder().name("Running Shoes").description("Lightweight breathable running shoes")
                    .price(new BigDecimal("2999.00")).quantity(40).category("Footwear").enabled(true).build(),
                Product.builder().name("Yoga Mat").description("Non-slip 6mm thick exercise mat")
                    .price(new BigDecimal("799.00")).quantity(60).category("Sports").enabled(true).build(),
                Product.builder().name("Water Bottle").description("Insulated stainless steel 1L bottle")
                    .price(new BigDecimal("599.00")).quantity(100).category("Sports").enabled(true).build(),
                Product.builder().name("Desk Lamp").description("LED desk lamp with adjustable brightness")
                    .price(new BigDecimal("1099.00")).quantity(35).category("Home").enabled(true).build(),
                Product.builder().name("Notebook Set").description("Pack of 3 hardcover A5 notebooks")
                    .price(new BigDecimal("349.00")).quantity(200).category("Stationery").enabled(true).build()
            );
            productRepository.saveAll(products);
            log.info(" Seeded {} sample products", products.size());
        }
    }
}
