# Campus Cab

A college airport cab-sharing app built with **React + Vite**, **Java 17+ / Spring Boot 3.5**, and **MySQL 8.4**.

Students verify their phone, complete their name and hostel/block number, then search or post a cab. Four routes are supported: **MIT Manipal campus → airport**, **airport → MIT Manipal campus**, **KMC Manipal campus → airport**, and **airport → KMC Manipal campus**. Search matches the **same origin and destination and flight times within ±60 minutes**, inclusive; anything farther away is excluded. Use flight departure time for campus-to-airport rides and flight arrival time for airport-to-campus rides. Posting requires the route, capacity (including the host), and flight date/time; a note is optional. A request is **not a reserved seat** until accepted.

## Run locally

Requires Node 22.12+ (or 24), Java 17–25, Maven 3.6.3+, and MySQL 8+.

Run MySQL, the Spring Boot backend, and the Vite frontend as separate processes. Start them in that order.

### 1. Start MySQL and create the database

Start your locally installed MySQL server using its service manager or startup command, and keep it running on port **3306**. Connect using your MySQL administrator account, for example with `mysql -u root -p`.

Create an empty `campus_cab` database and an application user with privileges on that database. Replace the password placeholder before running these statements in your MySQL administrator session (this is the application's database password, separate from your MySQL administrator password):

```sql
CREATE DATABASE campus_cab CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'campus_cab'@'localhost' IDENTIFIED BY 'YOUR_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON campus_cab.* TO 'campus_cab'@'localhost';
```

This database/user setup is needed only once. Flyway creates and updates the application tables automatically when the backend starts.

### 2. Configure the local environment

From the `campus-cab` directory:

```sh
cp .env.example .env
```

Edit `.env` and set `DB_PASSWORD` to the application user's password from step 1. Keep `VITE_DEMO_MODE=false` to use the real backend. The `.env` file is ignored by Git. Keep its values shell-compatible and quote passwords containing spaces or special characters.

### 3. Start the backend

In a backend terminal, from `campus-cab`:

```sh
cd backend
set -a
source ../.env
set +a
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

These commands work in zsh and bash. Spring Boot does not automatically load the root `.env` file; sourcing it exports the backend settings into this terminal. The development profile disables secure cookies on local HTTP and uses OTP **123456**, with no SMS sent. The backend listens on **http://localhost:8080**. Change `DB_URL` in `.env` if MySQL runs elsewhere; retain UTC connection settings. Keep this terminal running.

### 4. Start the frontend

In a separate frontend terminal, from `campus-cab`:

```sh
npm ci
npm run dev
```

Open the URL Vite prints (normally **http://127.0.0.1:5173**). Vite loads the frontend settings from `.env` and proxies `/api` to the Java backend on port 8080, keeping authentication same-origin. Leave `VITE_API_URL` empty for this setup. The real API is the default: it never silently falls back to sample data. Keep this terminal running as well. On subsequent starts, start MySQL and repeat the backend and frontend startup commands; you do not need to recreate the database, copy `.env`, or reinstall unchanged dependencies.

On Find a cab and Post a cab, choose MIT Manipal campus or KMC Manipal campus in either direction to/from the airport. The airport endpoint is fixed to `Airport`. Posting also requires selecting capacity (2–8, including you) and a future flight departure/arrival date and time; the note is optional. There is no separate pickup-time field. New rides remain available until their flight time. Existing rides retain any previously supplied pickup time and use that as their availability cutoff. Restart the backend after updating: Flyway adds the `origin` column and makes `pickup_at` optional automatically, preserving existing rides.

## Browser-only demo

```sh
VITE_DEMO_MODE=true npm run dev
```

No Java server or MySQL is used in this mode. The banner labels it as a demo. Use any international phone number with code **123456**, then complete the profile. Sample rides leave **tomorrow**, with outbound flights at 11:15, 12:00 and 12:30, plus a return ride arriving at 12:00 with airport pickup at 12:30. Search airport `Airport` at 12:00 and choose either direction. Existing demo browser data is kept; reset it using the instructions below to load the new sample return ride. Demo data is fictional and stored only in this browser's localStorage. A session is kept in sessionStorage.

To test the two-sided flow:

1. Log in under your own test number, complete your profile, and request Ananya's ride.
2. Sign out, then log in as **+91 9000000101** with **123456**.
3. Open Requests and accept the new request.
4. Sign out and log back in under the original number. See the notification, accepted request, and confirmed ride.

Seed host numbers: Ananya `+919000000101`, Arjun `+919000000102`, Riya `+919000000103`. These are fictional test identities; don't call them. To reset the demo, remove localStorage key `campus-cab-demo-v1` and sessionStorage key `campus-cab-user` using your browser's developer tools.

## Included behavior

- E.164 phone login with Twilio Verify integration; five-minute challenge expiry, attempt limits and resend cooldown.
- Mandatory name and block profile; immutable verified phone number.
- Posting with four fixed routes, mandatory capacity (2–8, including the host), mandatory flight departure/arrival date and time, and optional notes.
- Inclusive ±60-minute matching on both route endpoints and flight departure/arrival time, available seats, host contact, and expandable passenger contacts for authenticated students with complete profiles.
- Incoming and outgoing requests; only the host can accept/reject. Duplicate/self requests are blocked.
- Transactional seat limits: requests and decisions lock the ride. READ COMMITTED isolation prevents stale capacity reads after waiting for the lock, including on MySQL.
- Persistent website notifications for new requests, decisions and cancellations. Screens poll every 15 seconds.
- My rides, cancellation with passenger notifications, editable profile, logout, and responsive layouts. Cancelled rides disappear from My rides and stay hidden after refresh.
- Session fixation protection, HttpOnly session cookies, CSRF protection on writes, server validation, prepared SQL, schema constraints, and Flyway migrations.

## Real SMS and deployment

Set `OTP_MODE=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the backend environment, and run without the `dev` profile. Configure a Twilio Verify service first. Credentials stay on the Java server. Real SMS delivery needs your own account and has not been exercised here.

Build the frontend with `npm run build` (**without** `VITE_DEMO_MODE=true`). Configure your production web server to serve `dist`, fall back to `index.html` for frontend routes, and proxy `/api` to Spring Boot under the same HTTPS origin. Vite's development proxy is not included in the production build. Set `COOKIE_SECURE=true`, use managed MySQL/backups, and inject `DB_PASSWORD` from a secret manager. Cross-origin deployments need additional explicit CORS/cookie configuration; prefer a same-origin reverse proxy.

Sites hosts the **private interactive frontend demo only**. It does not run the Java service or MySQL. The complete backend is in this repository for a Java application host.

Phone verification proves control of a phone number. It does not establish college enrollment; institution-specific access would need a college-domain or invitation check. In this requested flow, student contacts are visible to other signed-in users with complete profiles.

OTP throttles and sessions are currently held in one Java process. For multiple backend replicas, add shared rate limits and Spring Session (for example Redis). Notifications refresh in-app while the page is open; this app does not send SMS/email/push ride notifications or book/pay for taxis.

## Verification

```sh
npm test
npm run build
cd backend
mvn test
```

The 9 frontend tests cover matching boundaries in both directions, route isolation between MIT and KMC in both directions, return-ride creation and requests, compatibility with existing demo rides, capacity/ownership, simplified posting without pickup time or notes, cancellation removal after reload, and the cross-account request-to-notification flow. The 14 backend integration tests use **H2 in MySQL compatibility mode**, applying the actual Flyway migrations. They cover login/session persistence, profile gating, CSRF/authentication, matching boundaries, route isolation between MIT and KMC in both directions, KMC route API persistence and requests, return-ride API persistence, legacy pickup validation, required capacity and future flight times, posting/joining/approval/expiry without pickup time, duplicates/ownership, rejection, cancellation removal from ride lists, and competing approvals for the last seat. Java compilation, all tests, and the frontend production build pass. Real MySQL runtime validation remains to be done.

## Structure

- `src/main.jsx` / `src/styles.css`: React screens and responsive design.
- `src/api.js`: same-origin Java API client, with explicit demo selection.
- `src/demo.js`: browser-only test identities and state.
- `backend/src/main/java/com/campuscab`: authentication, controllers, transactional storage, and SMS integration.
- `backend/src/main/resources/db/migration`: MySQL schema.
- `.env.example`: local frontend and backend environment settings.
- `vite.config.js`: frontend development server and API proxy.
- `backend/pom.xml`: backend dependencies and Maven commands.

Spring references: [system requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [authentication persistence](https://docs.spring.io/spring-security/reference/servlet/authentication/persistence.html).
