package com.campuscab;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = {
    "debug=false",
    "logging.level.root=WARN",
    "spring.datasource.url=jdbc:h2:mem:cab;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "app.otp-mode=dev",
    "server.servlet.session.cookie.secure=false",
  }
)
@AutoConfigureMockMvc
class CampusCabIntegrationTest {

  @Autowired
  Store store;

  @Autowired
  JdbcTemplate db;

  @Autowired
  MockMvc mvc;

  long host, alice, bob;
  Instant flight = Instant.now().plusSeconds(86400),
    pickup = flight.minusSeconds(10800);

  @BeforeEach
  void setup() {
    db.update("DELETE FROM notifications");
    db.update("DELETE FROM join_requests");
    db.update("DELETE FROM rides");
    db.update("DELETE FROM students");
    host = student("+919000000001", "Host");
    alice = student("+919000000002", "Alice");
    bob = student("+919000000003", "Bob");
  }

  long student(String phone, String name) {
    var s = store.login(phone);
    store.profile(s.id(), name, "Block A");
    return s.id();
  }

  Store.Ride ride(int capacity) {
    return store.create(host, "Airport", flight, pickup, capacity, "");
  }

  @Test
  void schemaAndMatchingWindow() {
    var r = ride(4);
    assertEquals(
      1,
      store.search(alice, flight.plusSeconds(3600), "Airport").size()
    );
    assertEquals(
      1,
      store.search(alice, flight.minusSeconds(3600), "Airport").size()
    );
    assertEquals(
      0,
      store.search(alice, flight.plusSeconds(3601), "Airport").size()
    );
    assertEquals(0, store.search(alice, flight, "Other airport").size());
    assertEquals(1, r.occupied());
  }

  @Test
  void approvalAndNotification() {
    var r = ride(3);
    var q = store.request(r.id(), alice);
    assertEquals(1, store.ride(r.id(), host).occupied());
    assertEquals(1, store.notices(host).size());
    store.decide(q.id(), host, true);
    assertEquals(2, store.ride(r.id(), host).occupied());
    assertEquals("ACCEPTED", store.requests(alice).get(0).status());
    assertTrue(store.notices(alice).get(0).message().contains("accepted"));
    assertEquals(1, store.mine(alice).size());
  }

  @Test
  void ownershipDuplicateAndProfileValidation() {
    var r = ride(3);
    var q = store.request(r.id(), alice);
    assertThrows(Exception.class, () -> store.request(r.id(), alice));
    assertThrows(Exception.class, () -> store.request(r.id(), host));
    assertThrows(Exception.class, () -> store.decide(q.id(), bob, true));
    long incomplete = store.login("+919000000004").id();
    assertThrows(Exception.class, () ->
      store.search(incomplete, flight, "Airport")
    );
    assertThrows(Exception.class, () ->
      store.create(host, "Airport", pickup, flight, 4, "")
    );
  }

  @Test
  void lastSeatIsProtectedAcrossConcurrentApprovals() throws Exception {
    var r = ride(2);
    long a = store.request(r.id(), alice).id(),
      b = store.request(r.id(), bob).id();
    CountDownLatch start = new CountDownLatch(1);
    AtomicInteger successes = new AtomicInteger();
    var executor = Executors.newFixedThreadPool(2);
    try {
      var one = executor.submit(() -> {
        try {
          start.await();
          store.decide(a, host, true);
          successes.incrementAndGet();
        } catch (Exception ignored) {}
      });
      var two = executor.submit(() -> {
        try {
          start.await();
          store.decide(b, host, true);
          successes.incrementAndGet();
        } catch (Exception ignored) {}
      });
      start.countDown();
      one.get(10, TimeUnit.SECONDS);
      two.get(10, TimeUnit.SECONDS);
      assertEquals(1, successes.get());
      assertEquals(2, store.ride(r.id(), host).occupied());
    } finally {
      executor.shutdownNow();
    }
  }

  @Test
  void cancellationNotifiesAndRemovesSearchResult() {
    var r = ride(3);
    var q = store.request(r.id(), alice);
    store.decide(q.id(), host, true);
    store.request(r.id(), bob);
    store.cancel(r.id(), host);
    assertEquals("CANCELLED", store.requests(alice).get(0).status());
    assertEquals("CANCELLED", store.requests(bob).get(0).status());
    assertTrue(store.notices(alice).get(0).message().contains("cancelled"));
    assertTrue(store.search(alice, flight, "Airport").isEmpty());
  }

  @Test
  void rejectionDoesNotOccupySeat() {
    var r = ride(2);
    var q = store.request(r.id(), alice);
    store.decide(q.id(), host, false);
    assertEquals(1, store.ride(r.id(), host).occupied());
    assertEquals("REJECTED", store.requests(alice).get(0).status());
    assertThrows(Exception.class, () -> store.decide(q.id(), host, true));
  }

  @Test
  void authenticationAndCsrfAreRequired() throws Exception {
    mvc.perform(get("/api/rides/mine")).andExpect(status().isUnauthorized());
    mvc
      .perform(post("/api/rides/1/requests").with(user(String.valueOf(alice))))
      .andExpect(status().isForbidden());
    long incomplete = store.login("+919000000009").id();
    mvc
      .perform(get("/api/rides/mine").with(user(String.valueOf(incomplete))))
      .andExpect(status().isForbidden());
  }

  @Test
  void otpLoginPersistsSessionAndRequiresProfile() throws Exception {
    MockHttpSession session = new MockHttpSession();
    mvc
      .perform(
        post("/api/auth/otp")
          .session(session)
          .with(csrf())
          .contentType("application/json")
          .content("{\"phone\":\"+919000000099\"}")
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.developmentOtp").value(true));
    mvc
      .perform(
        post("/api/auth/verify")
          .session(session)
          .with(csrf())
          .contentType("application/json")
          .content("{\"code\":\"000000\"}")
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/auth/verify")
          .session(session)
          .with(csrf())
          .contentType("application/json")
          .content("{\"code\":\"123456\"}")
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.phone").value("+919000000099"));
    mvc.perform(get("/api/me").session(session)).andExpect(status().isOk());
    mvc
      .perform(get("/api/rides/mine").session(session))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        put("/api/me")
          .session(session)
          .with(csrf())
          .contentType("application/json")
          .content("{\"name\":\"Test Student\",\"blockNumber\":\"A-2\"}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(get("/api/rides/mine").session(session))
      .andExpect(status().isOk());
  }
}
