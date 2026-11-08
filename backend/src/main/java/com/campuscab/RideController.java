package com.campuscab;

import static com.campuscab.AuthController.id;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
class RideController {

  final Store store;

  RideController(Store store) {
    this.store = store;
  }

  record Profile(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Size(max = 30) String blockNumber
  ) {}

  record NewRide(
    @NotBlank @Size(max = 100) String destination,
    @Size(min = 1, max = 100) String origin,
    @NotNull Instant flightAt,
    Instant pickupAt,
    @NotNull @Min(2) @Max(8) Integer capacity,
    @Size(max = 300) String notes
  ) {}

  record Decision(@NotNull Boolean accept) {}

  @PutMapping("/api/me")
  Store.Student profile(Principal p, @Valid @RequestBody Profile body) {
    return store.profile(id(p), body.name(), body.blockNumber());
  }

  @GetMapping("/api/rides")
  List<Store.Ride> search(
    Principal p,
    @RequestParam Instant flightAt,
    @RequestParam @NotBlank @Size(max = 100) String destination,
    @RequestParam(defaultValue = Store.CAMPUS) @NotBlank @Size(
      max = 100
    ) String origin
  ) {
    return store.search(id(p), flightAt, destination, origin);
  }

  @PostMapping("/api/rides")
  Store.Ride create(Principal p, @Valid @RequestBody NewRide r) {
    return store.create(
      id(p),
      r.destination(),
      r.flightAt(),
      r.pickupAt(),
      r.capacity(),
      r.notes(),
      r.origin()
    );
  }

  @GetMapping("/api/rides/mine")
  List<Store.Ride> mine(Principal p) {
    return store.mine(id(p));
  }

  @PostMapping("/api/rides/{rideId}/requests")
  Store.JoinRequest join(Principal p, @PathVariable long rideId) {
    return store.request(rideId, id(p));
  }

  @GetMapping("/api/requests")
  List<Store.JoinRequest> requests(Principal p) {
    return store.requests(id(p));
  }

  @PutMapping("/api/requests/{requestId}")
  Map<?, ?> decide(
    Principal p,
    @PathVariable long requestId,
    @Valid @RequestBody Decision body
  ) {
    store.decide(requestId, id(p), body.accept());
    return Map.of(
      "message",
      body.accept() ? "Request accepted." : "Request declined."
    );
  }

  @DeleteMapping("/api/rides/{rideId}")
  Map<?, ?> cancel(Principal p, @PathVariable long rideId) {
    store.cancel(rideId, id(p));
    return Map.of("message", "Ride cancelled.");
  }

  @GetMapping("/api/notifications")
  List<Store.Notice> notices(Principal p) {
    return store.notices(id(p));
  }

  @PutMapping("/api/notifications/read")
  Map<?, ?> read(Principal p) {
    store.readNotices(id(p));
    return Map.of("message", "Notifications read.");
  }
}
