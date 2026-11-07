package com.campuscab;

import static com.campuscab.Store.fail;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
class SmsService {

  final boolean dev;
  final String service;
  final RestClient client;

  SmsService(
    @Value("${app.otp-mode}") String mode,
    @Value("${app.twilio.account-sid}") String sid,
    @Value("${app.twilio.auth-token}") String token,
    @Value("${app.twilio.verify-service-sid}") String service
  ) {
    if (
      !mode.equals("dev") && !mode.equals("twilio")
    ) throw new IllegalArgumentException("OTP_MODE must be dev or twilio");
    dev = mode.equals("dev");
    this.service = service;
    client = RestClient.builder()
      .baseUrl("https://verify.twilio.com/v2/Services/")
      .defaultHeaders(h -> h.setBasicAuth(sid, token))
      .build();
  }

  Map<?, ?> call(String path, LinkedMultiValueMap<String, String> form) {
    if (service.isBlank()) throw fail(
      HttpStatus.SERVICE_UNAVAILABLE,
      "SMS login is not configured yet. Contact the administrator."
    );
    try {
      return client
        .post()
        .uri(service + path)
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .body(form)
        .retrieve()
        .body(Map.class);
    } catch (Exception e) {
      throw fail(
        HttpStatus.BAD_GATEWAY,
        "SMS verification is unavailable. Please try again shortly."
      );
    }
  }

  void send(String phone) {
    if (dev) return;
    var f = new LinkedMultiValueMap<String, String>();
    f.add("To", phone);
    f.add("Channel", "sms");
    call("/Verifications", f);
  }

  boolean verify(String phone, String code) {
    if (dev) return code.equals("123456");
    var f = new LinkedMultiValueMap<String, String>();
    f.add("To", phone);
    f.add("Code", code);
    return "approved".equals(call("/VerificationCheck", f).get("status"));
  }
}
