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
  void airportToCampusMatchingUsesArrivalAndBothRouteEndpoints() {
    Instant arrival = flight.truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    var inbound = store.create(
      host,
      Store.CAMPUS,
      arrival,
      arrival.plusSeconds(1800),
      4,
      "",
      "Airport"
    );
    ride(4);
    store.create(
      host,
      Store.CAMPUS,
      arrival,
      arrival.plusSeconds(1800),
      4,
      "",
      "Other airport"
    );
    for (long offset : new long[] { -3600, 0, 3600 }) {
      var matches = store.search(
        alice,
        arrival.plusSeconds(offset),
        Store.CAMPUS,
        " airport "
      );
      assertEquals(1, matches.size());
      assertEquals(inbound.id(), matches.get(0).id());
      assertEquals("Airport", matches.get(0).origin());
    }
    for (long offset : new long[] { -3601, 3601, 86400 }) {
      assertTrue(
        store
          .search(alice, arrival.plusSeconds(offset), Store.CAMPUS, "Airport")
          .isEmpty()
      );
    }
    assertEquals(1, store.search(alice, arrival, "Airport").size());
    var nearer = store.create(
      host,
      Store.CAMPUS,
      arrival.plusSeconds(600),
      arrival.plusSeconds(2400),
      4,
      "",
      "Airport"
    );
    assertEquals(
      nearer.id(),
      store
        .search(alice, arrival.plusSeconds(600), Store.CAMPUS, "Airport")
        .get(0)
        .id()
    );
    store.cancel(inbound.id(), host);
    assertEquals(
      1,
      store.search(alice, arrival, Store.CAMPUS, "Airport").size()
    );
  }

  @Test
  void pickupValidationDependsOnRouteDirection() {
    assertThrows(Exception.class, () ->
      store.create(host, Store.CAMPUS, flight, pickup, 4, "", "Airport")
    );
    assertThrows(Exception.class, () ->
      store.create(host, "Airport", flight, flight.plusSeconds(1), 4, "")
    );
    assertThrows(Exception.class, () ->
      store.create(
        host,
        Store.CAMPUS,
        flight,
        flight.plusSeconds(1),
        4,
        "",
        Store.CAMPUS
      )
    );
    assertThrows(Exception.class, () ->
      store.create(host, "Other airport", flight, pickup, 4, "", "Airport")
    );
    assertEquals(
      Store.CAMPUS,
      store
        .create(host, Store.CAMPUS, flight, flight, 4, "", "Airport")
        .destination()
    );
  }

  @Test
  void returnRideApiPersistsOriginAndAppliesOneHourLimit() throws Exception {
    Instant arrival = flight.truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    mvc
      .perform(
        post("/api/rides")
          .with(user(String.valueOf(host)))
          .with(csrf())
          .contentType("application/json")
          .content(
            """
            {"origin":"Airport","destination":"MIT Manipal campus","flightAt":"%s","pickupAt":"%s","capacity":4,"notes":"Meet at arrivals"}
            """.formatted(arrival, arrival.plusSeconds(1800))
          )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.origin").value("Airport"))
      .andExpect(jsonPath("$.destination").value(Store.CAMPUS));
    mvc
      .perform(
        get("/api/rides")
          .with(user(String.valueOf(alice)))
          .param("origin", "Airport")
          .param("destination", Store.CAMPUS)
          .param("flightAt", arrival.plusSeconds(3600).toString())
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));
    mvc
      .perform(
        get("/api/rides")
          .with(user(String.valueOf(alice)))
          .param("origin", "Airport")
          .param("destination", Store.CAMPUS)
          .param("flightAt", arrival.plusSeconds(3601).toString())
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(0));
    var ride = store.search(alice, arrival, Store.CAMPUS, "Airport").get(0);
    store.request(ride.id(), alice);
    mvc
      .perform(get("/api/requests").with(user(String.valueOf(alice))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$[0].origin").value("Airport"));
  }

  @Test
  void kmcRoutesPersistAndMatchSeparatelyFromMit() throws Exception {
    Instant at = flight.truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    for (boolean toCampus : new boolean[] { false, true }) {
      String origin = toCampus ? "Airport" : Store.KMC_CAMPUS;
      String destination = toCampus ? Store.KMC_CAMPUS : "Airport";
      mvc
        .perform(
          post("/api/rides")
            .with(user(String.valueOf(host)))
            .with(csrf())
            .contentType("application/json")
            .content(
              """
              {"origin":" %s ","destination":" %s ","flightAt":"%s","capacity":4}
              """.formatted(origin.toLowerCase(), destination.toLowerCase(), at)
            )
        )
        .andExpect(status().isOk())
        .andExpect(
          jsonPath(toCampus ? "$.destination" : "$.origin").value(
            Store.KMC_CAMPUS
          )
        );
      store.create(
        host,
        toCampus ? Store.CAMPUS : "Airport",
        at,
        null,
        4,
        "",
        toCampus ? "Airport" : Store.CAMPUS
      );
      var kmc = store.search(alice, at, destination, origin).get(0);
      for (long offset : new long[] { -3600, 0, 3600 }) {
        mvc
          .perform(
            get("/api/rides")
              .with(user(String.valueOf(alice)))
              .param("origin", origin)
              .param("destination", destination)
              .param("flightAt", at.plusSeconds(offset).toString())
          )
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(1))
          .andExpect(jsonPath("$[0].id").value(kmc.id()));
      }
      for (long offset : new long[] { -3601, 3601 }) {
        assertTrue(
          store
            .search(alice, at.plusSeconds(offset), destination, origin)
            .isEmpty()
        );
      }
      assertThrows(Exception.class, () ->
        store.create(
          host,
          destination,
          at,
          toCampus ? at.minusSeconds(1) : at.plusSeconds(1),
          4,
          "",
          origin
        )
      );
      store.create(
        host,
        destination,
        at,
        toCampus ? at.plusSeconds(1800) : at.minusSeconds(1800),
        4,
        "",
        origin
      );
      var request = store.request(kmc.id(), alice);
      assertEquals(kmc.origin(), request.origin());
      assertEquals(kmc.destination(), request.destination());
      store.decide(request.id(), host, true);
      assertEquals(2, store.ride(kmc.id(), host).occupied());
    }
    for (String origin : new String[] { Store.CAMPUS, Store.KMC_CAMPUS }) {
      for (String destination : new String[] {
        Store.CAMPUS,
        Store.KMC_CAMPUS,
      }) {
        assertThrows(Exception.class, () ->
          store.create(host, destination, at, null, 4, "", origin)
        );
      }
    }
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
  void simplifiedPostingSupportsBothRoutesWithoutPickupOrNotes()
    throws Exception {
    for (boolean toCampus : new boolean[] { false, true }) {
      String origin = toCampus ? "Airport" : Store.CAMPUS;
      String destination = toCampus ? Store.CAMPUS : "Airport";
      mvc
        .perform(
          post("/api/rides")
            .with(user(String.valueOf(host)))
            .with(csrf())
            .contentType("application/json")
            .content(
              """
              {"origin":"%s","destination":"%s","flightAt":"%s","capacity":3}
              """.formatted(origin, destination, flight)
            )
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.capacity").value(3))
        .andExpect(jsonPath("$.pickupAt").isEmpty())
        .andExpect(jsonPath("$.notes").value(""));
      var ride = store.search(alice, flight, destination, origin).get(0);
      assertNull(ride.pickupAt());
      var a = store.request(ride.id(), alice);
      var b = store.request(ride.id(), bob);
      assertNull(store.requests(alice).get(0).pickupAt());
      store.decide(a.id(), host, true);
      assertEquals(2, store.ride(ride.id(), host).occupied());
      db.update(
        "UPDATE rides SET flight_at=? WHERE id=?",
        java.sql.Timestamp.from(Instant.now().minusSeconds(60)),
        ride.id()
      );
      assertTrue(store.search(alice, flight, destination, origin).isEmpty());
      assertThrows(Exception.class, () -> store.decide(b.id(), host, true));
      assertThrows(Exception.class, () ->
        store.request(ride.id(), student("+919000000008", "Late student"))
      );
    }
  }

  @Test
  void simplifiedPostingRequiresValidCapacityAndFutureFlight()
    throws Exception {
    for (String capacity : new String[] {
      "",
      ",\"capacity\":null",
      ",\"capacity\":0",
      ",\"capacity\":1",
      ",\"capacity\":9",
    }) {
      mvc
        .perform(
          post("/api/rides")
            .with(user(String.valueOf(host)))
            .with(csrf())
            .contentType("application/json")
            .content(
              """
              {"origin":"MIT Manipal campus","destination":"Airport","flightAt":"%s"%s}
              """.formatted(flight, capacity)
            )
        )
        .andExpect(status().isBadRequest());
    }
    mvc
      .perform(
        post("/api/rides")
          .with(user(String.valueOf(host)))
          .with(csrf())
          .contentType("application/json")
          .content(
            """
            {"origin":"MIT Manipal campus","destination":"Airport","flightAt":"%s","capacity":3}
            """.formatted(Instant.now().minusSeconds(60))
          )
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/rides")
          .with(user(String.valueOf(host)))
          .with(csrf())
          .contentType("application/json")
          .content(
            """
            {"origin":"MIT Manipal campus","destination":"Airport","capacity":3}
            """
          )
      )
      .andExpect(status().isBadRequest());
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
  void cancellationNotifiesAndRemovesRideFromLists() throws Exception {
    var r = ride(3);
    var other = ride(4);
    var q = store.request(r.id(), alice);
    store.decide(q.id(), host, true);
    store.request(r.id(), bob);
    assertEquals(2, store.mine(host).size());
    assertEquals(1, store.mine(alice).size());
    store.cancel(r.id(), host);
    assertEquals("CANCELLED", store.requests(alice).get(0).status());
    assertEquals("CANCELLED", store.requests(bob).get(0).status());
    assertTrue(store.notices(alice).get(0).message().contains("cancelled"));
    assertTrue(
      store
        .search(alice, flight, "Airport")
        .stream()
        .noneMatch(ride -> ride.id() == r.id())
    );
    assertEquals(1, store.mine(host).size());
    assertEquals(other.id(), store.mine(host).get(0).id());
    assertTrue(store.mine(alice).isEmpty());
    mvc
      .perform(get("/api/rides/mine").with(user(String.valueOf(host))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].id").value(other.id()));
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
