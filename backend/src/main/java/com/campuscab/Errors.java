package com.campuscab;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class Errors {

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      Map.of(
        "message",
        e.getReason() == null ? "Request failed." : e.getReason()
      )
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) {
    return ResponseEntity.badRequest().body(
      Map.of(
        "message",
        e.getBindingResult().getFieldErrors().get(0).getField() +
          ": " +
          e.getBindingResult().getFieldErrors().get(0).getDefaultMessage()
      )
    );
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
  })
  ResponseEntity<?> malformed(Exception e) {
    return ResponseEntity.badRequest().body(
      Map.of("message", "Please check the submitted dates and fields.")
    );
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> duplicate(Exception e) {
    return ResponseEntity.status(409).body(
      Map.of(
        "message",
        "This action has already been recorded. Refresh and try again."
      )
    );
  }
}
