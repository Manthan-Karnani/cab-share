package com.campuscab;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.*;

@Configuration
class SecurityConfig {

  @Bean
  SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  SecurityFilterChain security(
    HttpSecurity http,
    SecurityContextRepository repo
  ) throws Exception {
    return http
      .authorizeHttpRequests(a ->
        a
          .requestMatchers(
            "/api/auth/csrf",
            "/api/auth/otp",
            "/api/auth/verify",
            "/api/config",
            "/error"
          )
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .securityContext(c -> c.securityContextRepository(repo))
      .formLogin(f -> f.disable())
      .httpBasic(h -> h.disable())
      .logout(l ->
        l
          .logoutUrl("/api/auth/logout")
          .logoutSuccessHandler((req, res, auth) -> res.setStatus(204))
      )
      .requestCache(c -> c.disable())
      .exceptionHandling(e ->
        e
          .authenticationEntryPoint((req, res, ex) -> {
            res.setStatus(401);
            res.setContentType("application/json");
            res
              .getWriter()
              .write("{\"message\":\"Please sign in to continue.\"}");
          })
          .accessDeniedHandler((req, res, ex) -> {
            res.setStatus(403);
            res.setContentType("application/json");
            res
              .getWriter()
              .write(
                "{\"message\":\"Your session needs refreshing. Reload and try again.\"}"
              );
          })
      )
      .build();
  }
}
