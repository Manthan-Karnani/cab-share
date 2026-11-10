package com.campuscab;

import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
class Store {

  static final String CAMPUS = "MIT Manipal campus";
  static final String KMC_CAMPUS = "KMC Manipal campus";

  static String campusName(String name) {
    return List.of(CAMPUS, KMC_CAMPUS)
      .stream()
      .filter(campus -> campus.equalsIgnoreCase(name))
      .findFirst()
      .orElse(null);
  }

  final JdbcTemplate db;

  Store(JdbcTemplate db) {
    this.db = db;
  }

  record Student(long id, String phone, String name, String blockNumber) {
    public boolean complete() {
      return (
        name != null &&
        !name.isBlank() &&
        blockNumber != null &&
        !blockNumber.isBlank()
      );
    }
  }

  record Ride(
    long id,
    Student creator,
    String destination,
    String origin,
    Instant flightAt,
    Instant pickupAt,
    int capacity,
    String notes,
    String status,
    int occupied,
    List<Student> members,
    String myRequestStatus
  ) {
    Instant availableUntil() {
      return pickupAt == null ? flightAt : pickupAt;
    }
  }

  record JoinRequest(
    long id,
    long rideId,
    Student student,
    String status,
    String destination,
    String origin,
    Instant flightAt,
    Instant pickupAt,
    boolean incoming
  ) {}

  record Notice(
    long id,
    long rideId,
    String message,
    boolean read,
    Instant createdAt
  ) {}

  final RowMapper<Student> studentMapper = (r, n) ->
    new Student(
      r.getLong("id"),
      r.getString("phone"),
      r.getString("name"),
      r.getString("block_number")
    );

  static Instant instant(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }

  static ResponseStatusException fail(HttpStatus status, String text) {
    return new ResponseStatusException(status, text);
  }

  Student student(long id) {
    return db
      .query("SELECT * FROM students WHERE id=?", studentMapper, id)
      .stream()
      .findFirst()
      .orElseThrow(() ->
        fail(HttpStatus.UNAUTHORIZED, "Please sign in again.")
      );
  }

  Student requireComplete(long id) {
    Student s = student(id);
    if (!s.complete()) throw fail(
      HttpStatus.FORBIDDEN,
      "Complete your profile first."
    );
    return s;
  }

  Student login(String phone) {
    db.update(
      "INSERT INTO students(phone) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM students WHERE phone=?)",
      phone,
      phone
    );
    return db.queryForObject(
      "SELECT * FROM students WHERE phone=?",
      studentMapper,
      phone
    );
  }

  Student profile(long id, String name, String block) {
    db.update(
      "UPDATE students SET name=?,block_number=? WHERE id=?",
      name.trim(),
      block.trim(),
      id
    );
    return student(id);
  }

  Ride ride(long id, long viewer) {
    return db
      .query(
        "SELECT * FROM rides WHERE id=?",
        (r, n) -> {
          Student creator = student(r.getLong("creator_id"));
          List<Student> members = new ArrayList<>();
          members.add(creator);
          members.addAll(
            db.query(
              "SELECT s.* FROM students s JOIN join_requests j ON s.id=j.student_id WHERE j.ride_id=? AND j.status='ACCEPTED' ORDER BY j.id",
              studentMapper,
              id
            )
          );
          String mine = db
            .query(
              "SELECT status FROM join_requests WHERE ride_id=? AND student_id=?",
              (rs, i) -> rs.getString(1),
              id,
              viewer
            )
            .stream()
            .findFirst()
            .orElse(null);
          return new Ride(
            id,
            creator,
            r.getString("destination"),
            r.getString("origin"),
            r.getTimestamp("flight_at").toInstant(),
            instant(r.getTimestamp("pickup_at")),
            r.getInt("capacity"),
            r.getString("notes"),
            r.getString("status"),
            members.size(),
            members,
            mine
          );
        },
        id
      )
      .stream()
      .findFirst()
      .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Ride not found."));
  }

  List<Ride> suggestions(long viewer) {
    requireComplete(viewer);
    Timestamp now = Timestamp.from(Instant.now());
    return db
      .query(
        "SELECT r.id FROM rides r WHERE r.status='OPEN' AND COALESCE(r.pickup_at,r.flight_at)>? AND r.flight_at>? AND r.capacity > (SELECT COUNT(*) + 1 FROM join_requests j WHERE j.ride_id=r.id AND j.status='ACCEPTED') ORDER BY r.flight_at,r.id LIMIT 3",
        (r, n) -> r.getLong(1),
        now,
        now
      )
      .stream()
      .map(id -> ride(id, viewer))
      .toList();
  }

  List<Ride> search(long viewer, Instant flight, String destination) {
    return search(viewer, flight, destination, CAMPUS);
  }

  List<Ride> search(
    long viewer,
    Instant flight,
    String destination,
    String origin
  ) {
    requireComplete(viewer);
    List<Long> ids = db.query(
      "SELECT id FROM rides WHERE status='OPEN' AND COALESCE(pickup_at,flight_at)>? AND flight_at BETWEEN ? AND ? AND LOWER(destination)=LOWER(?) AND LOWER(origin)=LOWER(?) ORDER BY ABS(TIMESTAMPDIFF(SECOND,flight_at,?)),id",
      (r, n) -> r.getLong(1),
      Timestamp.from(Instant.now()),
      Timestamp.from(flight.minusSeconds(3600)),
      Timestamp.from(flight.plusSeconds(3600)),
      destination.trim(),
      origin == null ? CAMPUS : origin.trim(),
      Timestamp.from(flight)
    );
    return ids
      .stream()
      .map(id -> ride(id, viewer))
      .filter(r -> r.occupied() < r.capacity())
      .toList();
  }

  Ride create(
    long creator,
    String destination,
    Instant flight,
    Instant pickup,
    int capacity,
    String notes
  ) {
    return create(
      creator,
      destination,
      flight,
      pickup,
      capacity,
      notes,
      CAMPUS
    );
  }

  Ride create(
    long creator,
    String destination,
    Instant flight,
    Instant pickup,
    int capacity,
    String notes,
    String origin
  ) {
    requireComplete(creator);
    origin = origin == null ? CAMPUS : origin.trim();
    destination = destination.trim();
    String originCampus = campusName(origin);
    String destinationCampus = campusName(destination);
    boolean toCampus = destinationCampus != null;
    if (
      origin.isBlank() ||
      destination.isBlank() ||
      toCampus == (originCampus != null)
    ) throw fail(
      HttpStatus.BAD_REQUEST,
      "Choose a route between an airport and MIT or KMC Manipal campus."
    );
    if (capacity < 2 || capacity > 8) throw fail(
      HttpStatus.BAD_REQUEST,
      "Cab capacity must be between 2 and 8, including you."
    );
    if (pickup == null && !flight.isAfter(Instant.now())) throw fail(
      HttpStatus.BAD_REQUEST,
      "Flight departure or arrival must be in the future."
    );
    if (pickup != null && !pickup.isAfter(Instant.now())) throw fail(
      HttpStatus.BAD_REQUEST,
      "Pickup must be in the future."
    );
    if (
      pickup != null &&
      (toCampus ? pickup.isBefore(flight) : !flight.isAfter(pickup))
    ) throw fail(
      HttpStatus.BAD_REQUEST,
      toCampus
        ? "Airport pickup must be at or after your flight arrival."
        : "Campus pickup must be before your flight departure."
    );
    db.update(
      "INSERT INTO rides(creator_id,destination,origin,flight_at,pickup_at,capacity,notes,status,created_at) VALUES(?,?,?,?,?,?,?,'OPEN',?)",
      creator,
      toCampus ? destinationCampus : destination,
      toCampus ? origin : originCampus,
      Timestamp.from(flight),
      pickup == null ? null : Timestamp.from(pickup),
      capacity,
      notes == null ? "" : notes.trim(),
      Timestamp.from(Instant.now())
    );
    long id = db.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    return ride(id, creator);
  }

  List<Ride> mine(long viewer) {
    requireComplete(viewer);
    return db
      .query(
        "SELECT DISTINCT r.id,r.flight_at FROM rides r LEFT JOIN join_requests j ON j.ride_id=r.id WHERE r.status<>'CANCELLED' AND (r.creator_id=? OR (j.student_id=? AND j.status='ACCEPTED')) ORDER BY r.flight_at DESC",
        (r, n) -> r.getLong("id"),
        viewer,
        viewer
      )
      .stream()
      .map(id -> ride(id, viewer))
      .toList();
  }

  void lock(long id) {
    if (
      db
        .query(
          "SELECT id FROM rides WHERE id=? FOR UPDATE",
          (r, n) -> r.getLong(1),
          id
        )
        .isEmpty()
    ) throw fail(HttpStatus.NOT_FOUND, "Ride not found.");
  }

  JoinRequest request(long id, long viewer) {
    Student s = requireComplete(viewer);
    lock(id);
    Ride r = ride(id, viewer);
    if (r.creator().id() == viewer) throw fail(
      HttpStatus.BAD_REQUEST,
      "You are already the creator of this ride."
    );
    if (
      !r.status().equals("OPEN") || !r.availableUntil().isAfter(Instant.now())
    ) throw fail(HttpStatus.CONFLICT, "This ride is no longer available.");
    if (r.occupied() >= r.capacity()) throw fail(
      HttpStatus.CONFLICT,
      "This cab is full."
    );
    if (r.myRequestStatus() != null) throw fail(
      HttpStatus.CONFLICT,
      "You have already requested this ride."
    );
    db.update(
      "INSERT INTO join_requests(ride_id,student_id,status,created_at) VALUES(?,?,'PENDING',?)",
      id,
      viewer,
      Timestamp.from(Instant.now())
    );
    long requestId = db.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    notify(
      r.creator().id(),
      id,
      s.name() + " wants to join your cab to " + r.destination() + "."
    );
    return new JoinRequest(
      requestId,
      id,
      s,
      "PENDING",
      r.destination(),
      r.origin(),
      r.flightAt(),
      r.pickupAt(),
      false
    );
  }

  List<JoinRequest> requests(long viewer) {
    requireComplete(viewer);
    return db.query(
      "SELECT j.*,r.destination,r.origin,r.flight_at,r.pickup_at,r.creator_id FROM join_requests j JOIN rides r ON r.id=j.ride_id WHERE r.creator_id=? OR j.student_id=? ORDER BY j.created_at DESC",
      (r, n) ->
        new JoinRequest(
          r.getLong("id"),
          r.getLong("ride_id"),
          student(r.getLong("student_id")),
          r.getString("status"),
          r.getString("destination"),
          r.getString("origin"),
          r.getTimestamp("flight_at").toInstant(),
          instant(r.getTimestamp("pickup_at")),
          r.getLong("creator_id") == viewer
        ),
      viewer,
      viewer
    );
  }

  void decide(long requestId, long viewer, boolean accept) {
    requireComplete(viewer);
    Long rideId = db
      .query(
        "SELECT ride_id FROM join_requests WHERE id=?",
        (r, n) -> r.getLong(1),
        requestId
      )
      .stream()
      .findFirst()
      .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Request not found."));
    lock(rideId);
    Ride ride = ride(rideId, viewer);
    if (ride.creator().id() != viewer) throw fail(
      HttpStatus.FORBIDDEN,
      "Only this ride's creator can respond."
    );
    Map<String, Object> j = db.queryForMap(
      "SELECT student_id,status FROM join_requests WHERE id=?",
      requestId
    );
    if (!j.get("status").equals("PENDING")) throw fail(
      HttpStatus.CONFLICT,
      "This request has already been answered."
    );
    if (
      !ride.status().equals("OPEN") ||
      !ride.availableUntil().isAfter(Instant.now())
    ) throw fail(HttpStatus.CONFLICT, "This ride is no longer available.");
    if (accept && ride.occupied() >= ride.capacity()) throw fail(
      HttpStatus.CONFLICT,
      "This cab is full. You cannot accept another passenger."
    );
    db.update(
      "UPDATE join_requests SET status=? WHERE id=?",
      accept ? "ACCEPTED" : "REJECTED",
      requestId
    );
    notify(
      ((Number) j.get("student_id")).longValue(),
      rideId,
      ride.creator().name() +
        (accept ? " accepted" : " declined") +
        " your request to join the cab to " +
        ride.destination() +
        "."
    );
  }

  void cancel(long rideId, long viewer) {
    requireComplete(viewer);
    lock(rideId);
    Ride r = ride(rideId, viewer);
    if (r.creator().id() != viewer) throw fail(
      HttpStatus.FORBIDDEN,
      "Only the creator can cancel this ride."
    );
    if (!r.status().equals("OPEN")) throw fail(
      HttpStatus.CONFLICT,
      "This ride is already cancelled."
    );
    db.query(
      "SELECT student_id FROM join_requests WHERE ride_id=? AND status IN ('PENDING','ACCEPTED')",
      (rs, n) -> rs.getLong(1),
      rideId
    ).forEach(id ->
      notify(
        id,
        rideId,
        r.creator().name() + " cancelled the cab to " + r.destination() + "."
      )
    );
    db.update("UPDATE rides SET status='CANCELLED' WHERE id=?", rideId);
    db.update(
      "UPDATE join_requests SET status='CANCELLED' WHERE ride_id=? AND status IN ('PENDING','ACCEPTED')",
      rideId
    );
  }

  void notify(long student, long ride, String message) {
    db.update(
      "INSERT INTO notifications(student_id,ride_id,message,created_at) VALUES(?,?,?,?)",
      student,
      ride,
      message,
      Timestamp.from(Instant.now())
    );
  }

  List<Notice> notices(long viewer) {
    requireComplete(viewer);
    return db.query(
      "SELECT * FROM notifications WHERE student_id=? ORDER BY created_at DESC,id DESC LIMIT 100",
      (r, n) ->
        new Notice(
          r.getLong("id"),
          r.getLong("ride_id"),
          r.getString("message"),
          r.getBoolean("is_read"),
          r.getTimestamp("created_at").toInstant()
        ),
      viewer
    );
  }

  void readNotices(long viewer) {
    requireComplete(viewer);
    db.update(
      "UPDATE notifications SET is_read=TRUE WHERE student_id=?",
      viewer
    );
  }
}
