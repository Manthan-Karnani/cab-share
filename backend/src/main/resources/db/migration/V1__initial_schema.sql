CREATE TABLE students (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 phone VARCHAR(16) NOT NULL UNIQUE,
 name VARCHAR(80),
 block_number VARCHAR(30)
);
CREATE TABLE rides (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 creator_id BIGINT NOT NULL,
 destination VARCHAR(100) NOT NULL,
 flight_at TIMESTAMP(6) NOT NULL,
 pickup_at TIMESTAMP(6) NOT NULL,
 capacity INT NOT NULL,
 notes VARCHAR(300) NOT NULL DEFAULT '',
 status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
 created_at TIMESTAMP(6) NOT NULL,
 FOREIGN KEY (creator_id) REFERENCES students(id),
 CONSTRAINT valid_capacity CHECK (capacity BETWEEN 2 AND 8)
);
CREATE INDEX idx_ride_match ON rides(status, flight_at);
CREATE TABLE join_requests (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 ride_id BIGINT NOT NULL,
 student_id BIGINT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 created_at TIMESTAMP(6) NOT NULL,
 FOREIGN KEY (ride_id) REFERENCES rides(id),
 FOREIGN KEY (student_id) REFERENCES students(id),
 CONSTRAINT uq_ride_student UNIQUE (ride_id, student_id)
);
CREATE INDEX idx_request_status ON join_requests(ride_id,status);
CREATE TABLE notifications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 student_id BIGINT NOT NULL,
 ride_id BIGINT NOT NULL,
 message VARCHAR(300) NOT NULL,
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMP(6) NOT NULL,
 FOREIGN KEY (student_id) REFERENCES students(id),
 FOREIGN KEY (ride_id) REFERENCES rides(id)
);
CREATE INDEX idx_notification_student ON notifications(student_id, created_at);
