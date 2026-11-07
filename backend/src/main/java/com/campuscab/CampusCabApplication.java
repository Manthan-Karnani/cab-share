package com.campuscab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
  exclude = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
)
public class CampusCabApplication {

  public static void main(String[] args) {
    SpringApplication.run(CampusCabApplication.class, args);
  }
}
