# Campus Cab

A college airport cab-sharing app built with **React + Vite**, **Java 17+ / Spring Boot 3.5**, and **MySQL 8.4**.

Students verify their phone, complete their name and hostel/block number, then search or post a cab. Search matches the **same destination and flight departures within ±60 minutes**, inclusive. Cab pickup is recorded separately from flight departure. The host counts toward capacity. A request is **not a reserved seat** until accepted.

## Run everything with Docker

Requires Docker Desktop / Docker Compose.

```sh
cp .env.example .env
# Edit the two MySQL passwords in .env before starting.
docker compose up --build
```

Open **http://localhost:8088**. The example environment deliberately enables local development OTP **123456**, with no SMS. MySQL data persists in a Docker volume. The database is on the private Compose network; no database port is exposed. Flyway applies the schema automatically.

## Run without Docker

Requires Node 22.12+ (or 24), Java 17–25, Maven 3.6.3+, and MySQL 8+.

Create an empty `campus_cab` database and an application user with privileges on that database. For example, replace the password placeholder in these statements before running them in your MySQL administrator session:

```sql
CREATE DATABASE campus_cab CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'campus_cab'@'localhost' IDENTIFIED BY 'YOUR_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON campus_cab.* TO 'campus_cab'@'localhost';
```

In terminal one, from `campus-cab/backend`:

```sh
export DB_USERNAME=campus_cab
# Supply DB_PASSWORD via your shell or secret manager; do not commit it.
read -s 'DB_PASSWORD?MySQL app password: '; export DB_PASSWORD
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The `read` command above is for zsh on macOS; in bash, use `read -s -p 'MySQL app password: ' DB_PASSWORD` instead. The development profile disables secure cookies on local HTTP and uses OTP 123456. Backend listens on port 8080. Override `DB_URL` if MySQL runs elsewhere; retain UTC connection settings.

In terminal two, from `campus-cab`:

```sh
npm ci
npm run dev
```

Open the URL Vite prints (normally **http://127.0.0.1:5173**). Vite proxies `/api` to the Java backend, keeping authentication same-origin. The real API is the default: it never silently falls back to sample data.

## Browser-only demo

```sh
VITE_DEMO_MODE=true npm run dev
```

No Java server or MySQL is used in this mode. The banner labels it as a demo. Use any international phone number with code **123456**, then complete the profile. Sample rides leave **tomorrow**, with flights at 11:15, 12:00 and 12:30. Search destination `Airport` at 12:00. Demo data is fictional and stored only in this browser's localStorage. A session is kept in sessionStorage.

To test the two-sided flow:

1. Log in under your own test number, complete your profile, and request Ananya's ride.
2. Sign out, then log in as **+91 9000000101** with **123456**.
3. Open Requests and accept the new request.
4. Sign out and log back in under the original number. See the notification, accepted request, and confirmed ride.

Seed host numbers: Ananya `+919000000101`, Arjun `+919000000102`, Riya `+919000000103`. These are fictional test identities; don't call them. To reset the demo, remove localStorage key `campus-cab-demo-v1` and sessionStorage key `campus-cab-user` using your browser's developer tools.

## Included behavior

- E.164 phone login with Twilio Verify integration; five-minute challenge expiry, attempt limits and resend cooldown.
- Mandatory name and block profile; immutable verified phone number.
- Posting with destination, flight departure, campus pickup, 2–8 seats, and optional notes.
- Inclusive ±60-minute matching, available seats, host contact, and expandable passenger contacts for authenticated students with complete profiles.
- Incoming and outgoing requests; only the host can accept/reject. Duplicate/self requests are blocked.
- Transactional seat limits: requests and decisions lock the ride. READ COMMITTED isolation prevents stale capacity reads after waiting for the lock, including on MySQL.
- Persistent website notifications for new requests, decisions and cancellations. Screens poll every 15 seconds.
- My rides, cancellation with passenger notifications, editable profile, logout, and responsive layouts.
- Session fixation protection, HttpOnly session cookies, CSRF protection on writes, server validation, prepared SQL, schema constraints, and Flyway migrations.

## Real SMS and deployment

Set `OTP_MODE=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the backend environment. Configure a Twilio Verify service first. Credentials stay on the Java server. Real SMS delivery needs your own account and has not been exercised here.

Build the frontend with `npm run build` (**without** `VITE_DEMO_MODE=true`). Serve `dist` and proxy `/api` to Spring Boot under the same HTTPS origin, as in `nginx.conf`. Set `COOKIE_SECURE=true`, use managed MySQL/backups, and inject `DB_PASSWORD` from a secret manager. The supplied Compose port binds to localhost for development; adapt the ingress for your host. Cross-origin deployments need additional explicit CORS/cookie configuration; prefer a same-origin reverse proxy.

Sites hosts the **private interactive frontend demo only**. It does not run the Java service or MySQL. The complete backend is in this repository for a JVM/container host.

Phone verification proves control of a phone number. It does not establish college enrollment; institution-specific access would need a college-domain or invitation check. In this requested flow, student contacts are visible to other signed-in users with complete profiles.

OTP throttles and sessions are currently held in one Java process. For multiple backend replicas, add shared rate limits and Spring Session (for example Redis). Notifications refresh in-app while the page is open; this app does not send SMS/email/push ride notifications or book/pay for taxis.

## Verification

```sh
npm test
npm run build
cd backend
mvn test
```

The 3 frontend tests cover the matching boundary, capacity/ownership and the cross-account request-to-notification flow. The 8 backend integration tests use **H2 in MySQL compatibility mode**, applying the actual Flyway migration. They cover login/session persistence, profile gating, CSRF/authentication, matching boundaries, duplicates/ownership, rejection, cancellation, and competing approvals for the last seat. Java compilation and all tests were run. A real MySQL server and Docker were not available in the development environment, so MySQL/Docker runtime validation remains to be done. Browser visual QA was unavailable because the browser-access host could not be reached.

## Structure

- `src/main.jsx` / `src/styles.css`: React screens and responsive design.
- `src/api.js`: same-origin Java API client, with explicit demo selection.
- `src/demo.js`: browser-only test identities and state.
- `backend/src/main/java/com/campuscab`: authentication, controllers, transactional storage, and SMS integration.
- `backend/src/main/resources/db/migration`: MySQL schema.
- `compose.yml`, Dockerfiles, and `nginx.conf`: full-stack container setup.

Spring references: [system requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [authentication persistence](https://docs.spring.io/spring-security/reference/servlet/authentication/persistence.html).
