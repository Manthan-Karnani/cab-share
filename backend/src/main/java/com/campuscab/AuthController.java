package com.campuscab;

import static com.campuscab.Store.fail;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.security.Principal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
class AuthController {

  final Store store;
  final SmsService sms;
  final SecurityContextRepository contexts;
  final Map<String, Window> windows = new ConcurrentHashMap<>();

  record Window(long start, int count) {}

  AuthController(
    Store store,
    SmsService sms,
    SecurityContextRepository contexts
  ) {
    this.store = store;
    this.sms = sms;
    this.contexts = contexts;
  }

  record Phone(
    @Pattern(
      regexp = "\\+[1-9][0-9]{7,14}",
      message = "Use an international phone number, for example +919876543210"
    )
    String phone
  ) {}

  record Verification(
    @Pattern(regexp = "[0-9]{6}", message = "Enter the six-digit code")
    String code
  ) {}

  @GetMapping("/api/config")
  Map<?, ?> config() {
    return Map.of("developmentOtp", sms.dev);
  }

  @GetMapping("/api/auth/csrf")
  Map<?, ?> csrf(CsrfToken token) {
    return Map.of(
      "token",
      token.getToken(),
      "headerName",
      token.getHeaderName()
    );
  }

  synchronized void limit(String key, int max) {
    long now = System.currentTimeMillis();
    windows.entrySet().removeIf(e -> now - e.getValue().start() > 3600000);
    var w = windows.get(key);
    if (w == null || now - w.start() > 3600000) w = new Window(now, 0);
    if (w.count() >= max) throw fail(
      HttpStatus.TOO_MANY_REQUESTS,
      "Too many verification attempts. Try again in an hour."
    );
    windows.put(key, new Window(w.start(), w.count() + 1));
  }

  @PostMapping("/api/auth/otp")
  Map<?, ?> send(@Valid @RequestBody Phone body, HttpServletRequest req) {
    if (body.phone() == null) throw fail(
      HttpStatus.BAD_REQUEST,
      "Enter your phone number."
    );
    HttpSession session = req.getSession();
    Long last = (Long) session.getAttribute("otpSentAt");
    long now = System.currentTimeMillis();
    if (last != null && now - last < 60000) throw fail(
      HttpStatus.TOO_MANY_REQUESTS,
      "Wait 60 seconds before requesting another code."
    );
    limit("ip:" + req.getRemoteAddr(), 20);
    limit("phone:" + body.phone(), 5);
    sms.send(body.phone());
    session.setAttribute("otpPhone", body.phone());
    session.setAttribute("otpSentAt", now);
    session.setAttribute("otpAttempts", 0);
    return Map.of(
      "message",
      sms.dev
        ? "Development mode: use 123456. No SMS was sent."
        : "Verification code sent.",
      "developmentOtp",
      sms.dev
    );
  }

  @PostMapping("/api/auth/verify")
  Store.Student verify(
    @Valid @RequestBody Verification body,
    HttpServletRequest req,
    HttpServletResponse res
  ) {
    HttpSession session = req.getSession(false);
    if (session == null || session.getAttribute("otpPhone") == null) throw fail(
      HttpStatus.BAD_REQUEST,
      "Request a new verification code."
    );
    synchronized (session) {
      long sent = (Long) session.getAttribute("otpSentAt");
      int attempts = (Integer) session.getAttribute("otpAttempts");
      if (System.currentTimeMillis() - sent > 300000 || attempts >= 5) {
        session.removeAttribute("otpPhone");
        throw fail(HttpStatus.BAD_REQUEST, "Code expired. Request a new one.");
      }
      session.setAttribute("otpAttempts", attempts + 1);
      if (
        body.code() == null ||
        !sms.verify((String) session.getAttribute("otpPhone"), body.code())
      ) throw fail(HttpStatus.BAD_REQUEST, "Incorrect code. Please try again.");
      Store.Student user = store.login(
        (String) session.getAttribute("otpPhone")
      );
      session.removeAttribute("otpPhone");
      req.changeSessionId();
      var context = SecurityContextHolder.createEmptyContext();
      context.setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(
          String.valueOf(user.id()),
          null,
          List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        )
      );
      SecurityContextHolder.setContext(context);
      contexts.saveContext(context, req, res);
      return user;
    }
  }

  static long id(Principal p) {
    return Long.parseLong(p.getName());
  }

  @GetMapping("/api/me")
  Store.Student me(Principal p) {
    return store.student(id(p));
  }
}
