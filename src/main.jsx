import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  CarFront,
  Plane,
  ShieldCheck,
  Users,
  Phone,
  MapPin,
  CalendarDays,
  Clock3,
  Check,
  Plus,
  Search,
  Bell,
  LogOut,
  LayoutGrid,
  UserRound,
  CheckCheck,
  X,
  Menu,
  LoaderCircle,
  ChevronDown,
  Leaf,
  Copy,
  Info,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import { api, DEMO } from "./api";
import { tomorrow, localInstant } from "./demo";
import { ROUTES, isToCampus, routeLabel, rideDeadline } from "./routes";
import CursorGlow from "./CursorGlow";
import NightDrive from "./NightDrive";
import "./styles.css";
const dateLabel = (s) =>
  new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const timeLabel = (s) =>
  new Date(s).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
const initials = (n) =>
  (n || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
const complete = (u) => !!(u?.name?.trim() && u?.blockNumber?.trim());
function Logo() {
  return (
    <a className="logo" href="/" aria-label="Campus Cab home">
      <span className="logo-icon">
        <CarFront size={25} strokeWidth={1.8} />
      </span>
      <span>
        campus<span className="logo-light">cab</span>
        <span className="logo-dot">.</span>
      </span>
    </a>
  );
}
function TaxiArt({ small = false }) {
  return (
    <svg
      className={small ? "taxi-art small" : "taxi-art"}
      viewBox="0 0 600 365"
      fill="none"
      aria-label="Illustration of an orange shared taxi travelling from campus to the airport"
      role="img"
    >
      <defs>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#62442f" opacity=".4" />
        </pattern>
      </defs>
      <rect width="600" height="365" rx="20" fill="url(#dots)" />
      <circle cx="308" cy="172" r="139" fill="#24180f" />
      <circle
        cx="308"
        cy="172"
        r="109"
        stroke="#5c3b22"
        strokeDasharray="4 7"
      />
      <path d="M46 300H552" stroke="#5c4a3a" strokeWidth="2" />
      <path
        d="M75 297V202h70v95M64 202l46-28 47 28M98 188v-38h25v38M102 145h17"
        fill="#201b18"
        stroke="#70523c"
        strokeWidth="2"
      />
      <path
        d="M89 217h10v12H89zm28 0h10v12h-10zm-28 26h10v12H89zm28 0h10v12h-10z"
        fill="#9b633c"
      />
      <path
        d="M462 296V217h50v79M449 218h76M487 215V147"
        stroke="#70523c"
        strokeWidth="2"
      />
      <path
        d="m481 162-39-9 3-5 37 3 8-31c2-7 7-6 7 1l-2 31 32 17-1 6-33-11-2 14 8 6-2 4-14-7-14 1v-4l12-4z"
        fill="#a34d23"
      />
      <path
        d="M115 262c10-27 58-26 82-27l28-59c5-9 11-14 24-14h97c14 0 22 7 32 19l40 51 49 11c14 3 23 16 23 31v20H114z"
        fill="#ec7c36"
        stroke="#a34d23"
        strokeWidth="3"
      />
      <path d="m232 179-25 55h151l-3-55z" fill="#44382d" />
      <path d="M367 183l39 51h-40z" fill="#44382d" />
      <path
        d="M279 179v56M204 246v47M358 246v47"
        stroke="#a34d23"
        strokeWidth="3"
      />
      <path d="M118 268h27v12h-27M462 261h22v13h-22" fill="#ffd7a3" />
      <rect x="292" y="242" width="20" height="4" rx="2" fill="#ffc18d" />
      <rect x="374" y="242" width="19" height="4" rx="2" fill="#ffc18d" />
      <path
        d="M262 160v-13a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v13"
        fill="#ffad65"
        stroke="#a34d23"
        strokeWidth="2"
      />
      <text
        x="271"
        y="155"
        fontSize="10"
        fill="#a34d23"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        TAXI
      </text>
      <circle cx="182" cy="291" r="30" fill="#121213" />
      <circle cx="182" cy="291" r="16" fill="#d6bda1" />
      <circle cx="182" cy="291" r="7" fill="#7c6451" />
      <circle cx="421" cy="291" r="30" fill="#121213" />
      <circle cx="421" cy="291" r="16" fill="#d6bda1" />
      <circle cx="421" cy="291" r="7" fill="#7c6451" />
      <path d="M264 232v-18c0-12-7-21-17-21s-18 9-18 21v18" fill="#9a613d" />
      <circle cx="248" cy="191" r="10" fill="#cead83" />
      <path d="M332 232v-18c0-12-7-21-17-21s-18 9-18 21v18" fill="#e0a56c" />
      <circle cx="316" cy="191" r="10" fill="#b98e68" />
      <path
        d="M71 278h-25m36-15H62"
        stroke="#a57750"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M519 296v-33m0 17c-24-2-19-21-19-21 19 0 19 15 19 15m1-2c1-24 19-27 19-27 7 20-11 28-19 27"
        fill="#a46b3d"
      />
      <rect
        x="195"
        y="55"
        width="153"
        height="44"
        rx="22"
        fill="#1c1713"
        stroke="#61412a"
      />
      <circle cx="220" cy="77" r="12" fill="#342216" />
      <path d="m215 77 4 4 7-8" stroke="#ff974d" strokeWidth="2" />
      <text x="240" y="82" fontSize="13" fill="#e7b48d" fontFamily="sans-serif">
        Better, together.
      </text>
      <path
        d="M361 82c44 3 66 24 70 51"
        stroke="#a86d3a"
        strokeWidth="2"
        strokeDasharray="5 6"
      />
      <circle cx="432" cy="142" r="5" fill="#a86d3a" />
    </svg>
  );
}
function Button({ children, busy, disabled, className = "", ...props }) {
  return (
    <button
      className={`button ${className}`}
      disabled={busy || disabled}
      {...props}
    >
      {busy ? <LoaderCircle size={18} className="spin" /> : null}
      {children}
    </button>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function ErrorText({ message }) {
  return message ? (
    <div className="error" role="alert">
      <Info size={16} />
      <span>{message}</span>
    </div>
  ) : null;
}
function Modal({ title, subtitle, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const els = ref.current.querySelectorAll(
          'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
        );
        const a = els[0],
          b = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === a ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          b?.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        {onClose && (
          <button
            className="icon-button close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        )}
        <div className="modal-icon">
          <CarFront size={25} />
        </div>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}
function Landing({ onLogin }) {
  const stepsRef = useRef(null);
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const cards = Array.from(stepsRef.current?.children ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -32px 0px" },
    );

    for (const card of cards) {
      card.classList.add("step-reveal");
      observer.observe(card);
    }

    return () => {
      observer.disconnect();
      for (const card of cards) {
        card.classList.remove("step-reveal", "is-visible");
      }
    };
  }, []);

  const [phone, setPhone] = useState(""),
    [country, setCountry] = useState("+91"),
    [code, setCode] = useState(""),
    [stage, setStage] = useState("phone"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dev, setDev] = useState(false),
    [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (stage === "phone") {
        const r = await api.sendOtp(`${country}${phone.replace(/\D/g, "")}`);
        setDev(r.developmentOtp);
        setStage("code");
        setCooldown(60);
      } else onLogin(await api.verifyOtp(code));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav>
          <a href="#how-it-works">
            How it works <ArrowUpRight size={15} />
          </a>
          <span className="campus-tag">
            <span className="live-dot" /> Your campus. Your people.
          </span>
        </nav>
      </header>
      {DEMO && (
        <div className="demo-banner">
          <Info size={14} />
          <span>
            Interactive demo · sample students and browser-only data · no SMS is
            sent
          </span>
        </div>
      )}
      <main>
        <div className="landing-grid">
          <section className="hero">
            <h1>
              Same airport.
              <br />
              Shared ride.
              <br />
              <span>Better company.</span>
            </h1>
            <p className="hero-copy">
              Find students flying around your time.
              <br className="desktop-break" /> Split the cab, share the journey,
              and head home together.
            </p>
            <div className="hero-pills">
              <span>
                <ShieldCheck size={16} /> Phone verified
              </span>
              <span>
                <Users size={16} /> Campus connected
              </span>
              <span>
                <Leaf size={16} /> A lighter footprint
              </span>
            </div>
            <NightDrive />
            <div className="art-caption">
              <span className="caption-line" /> A little company. A lighter
              fare. <span className="caption-line" />
            </div>
          </section>
          <section className="login-wrap" id="login">
            <div className="login-card">
              <h2>{stage === "phone" ? "Log in" : "Verify your number"}</h2>
              {stage === "code" && (
                <p className="muted">
                  Enter the 6-digit code for {country} {phone}.
                </p>
              )}
              <form className="login-form" onSubmit={submit}>
                {stage === "phone" ? (
                  <Field label="Phone number">
                    <div className="phone-input">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        aria-label="Country code"
                      >
                        <option value="+91">IN +91</option>
                        <option value="+1">US +1</option>
                        <option value="+44">UK +44</option>
                        <option value="+971">AE +971</option>
                      </select>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="Enter your phone number"
                        required
                        pattern="[0-9 ()-]{7,18}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </Field>
                ) : (
                  <>
                    <Field label="Verification code">
                      <input
                        className="otp-input"
                        autoFocus
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        placeholder="· · · · · ·"
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </Field>
                    {dev && (
                      <div className="dev-note">
                        <Info size={16} />
                        <span>
                          {DEMO ? "Demo" : "Development"} code:{" "}
                          <strong>123456</strong>. No SMS was sent.
                        </span>
                      </div>
                    )}
                  </>
                )}
                <ErrorText message={error} />
                <Button busy={busy} className="full" type="submit">
                  {stage === "phone" ? "Continue" : "Verify & log in"}
                  <ArrowRight size={18} />
                </Button>
                {stage === "code" && (
                  <div className="code-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setStage("phone");
                        setCode("");
                        setError("");
                      }}
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      disabled={cooldown > 0 || busy}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          await api.sendOtp(country + phone.replace(/\D/g, ""));
                          setCooldown(60);
                        } catch (e) {
                          setError(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <p className="eyebrow">LESS PLANNING. MORE GOING.</p>
            <h2>Three stops to a shared ride.</h2>
          </div>
          <div className="steps" ref={stepsRef}>
            {[
              {
                icon: UserRound,
                n: "01",
                title: "Make yourself at home",
                text: "Verify your number. Add your name and hostel block.",
              },
              {
                icon: Search,
                n: "02",
                title: "Find your airport crew",
                text: "Match with flights within an hour, or post your own cab.",
              },
              {
                icon: CarFront,
                n: "03",
                title: "Request. Connect. Go.",
                text: "Your host accepts, you get notified, and you split the ride.",
              },
            ].map(({ icon: Icon, n, title, text }) => (
              <div
                className="step"
                key={n}
                style={{ "--reveal-delay": `${180 + (Number(n) - 1) * 140}ms` }}
              >
                <div className="step-top">
                  <Icon size={23} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>A shared ride makes a better journey.</span>
        <span>
          Made for campus life <span className="heart">♡</span>
        </span>
      </footer>
    </div>
  );
}
function ProfileForm({ user, onSave, onClose, first = false }) {
  const [name, setName] = useState(user.name || ""),
    [blockNumber, setBlock] = useState(user.blockNumber || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title={first ? "First, a little introduction." : "Your campus profile"}
      subtitle={
        first
          ? "Let your travel buddies know who’s joining. Complete your profile to find or post a cab."
          : "Keep your details up to date for your travel crew."
      }
      onClose={onClose}
    >
      <form
        className="stack-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            onSave(
              await api.profile({
                name: name.trim(),
                blockNumber: blockNumber.trim(),
              }),
            );
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Your full name">
          <input
            autoComplete="name"
            placeholder="e.g. Aditi Verma"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Hostel / block number">
          <input
            placeholder="e.g. Block B, room 204"
            required
            maxLength={30}
            value={blockNumber}
            onChange={(e) => setBlock(e.target.value)}
          />
        </Field>
        <Field
          label="Verified phone number"
          hint="This number is shared with signed-in students for ride coordination."
        >
          <input value={user.phone} readOnly className="read-only" />
        </Field>
        <ErrorText message={error} />
        <Button
          busy={busy}
          type="submit"
          className="full"
          disabled={!name.trim() || !blockNumber.trim()}
        >
          {first ? "Save & find my crew" : "Save profile"}
          <ArrowRight size={18} />
        </Button>
      </form>
    </Modal>
  );
}
function RouteDirection({ value, onChange }) {
  return (
    <Field label="Route">
      <select required value={value} onChange={(e) => onChange(e.target.value)}>
        {ROUTES.map((route) => (
          <option key={route.id} value={route.id}>
            {routeLabel(route)}
          </option>
        ))}
      </select>
    </Field>
  );
}
function PostForm({ onClose, onCreated, initialRouteId = ROUTES[0].id }) {
  const [routeId, setRouteId] = useState(initialRouteId),
    [date, setDate] = useState(tomorrow()),
    [time, setTime] = useState("12:00"),
    [capacity, setCapacity] = useState(""),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const route = ROUTES.find((route) => route.id === routeId);
  const toCampus = isToCampus(route);
  return (
    <Modal
      title="Make room for company."
      subtitle="Post your airport cab. You’ll approve each person before they join."
      onClose={onClose}
    >
      <form
        className="stack-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api.create({
              origin: route.origin,
              destination: route.destination,
              flightAt: localInstant(date, time),
              capacity: Number(capacity),
              notes,
            });
            onCreated();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <RouteDirection value={routeId} onChange={setRouteId} />
        <Field label="Cab capacity (including you) — required">
          <select
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          >
            <option value="" disabled>
              Select capacity
            </option>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} people
              </option>
            ))}
          </select>
        </Field>
        <div className="form-row">
          <Field
            label={toCampus ? "Flight arrival date" : "Flight departure date"}
          >
            <input
              type="date"
              required
              min={new Date().toLocaleDateString("en-CA")}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field
            label={toCampus ? "Flight arrival time" : "Flight departure time"}
          >
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>
        <Field label="A note for your crew (optional)">
          <textarea
            maxLength={300}
            rows={2}
            placeholder="Meeting point, luggage space, or anything helpful…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <ErrorText message={error} />
        <Button busy={busy} className="full" type="submit">
          Post my cab <Plus size={18} />
        </Button>
      </form>
    </Modal>
  );
}
function RideCard({ ride, user, onJoin, onCancel, busy }) {
  const [expanded, setExpanded] = useState(false);
  const toCampus = isToCampus(ride);
  const own = ride.creator.id === user.id;
  const status = ride.myRequestStatus;
  const inactive =
    ride.status !== "OPEN" || new Date(rideDeadline(ride)) <= new Date();
  return (
    <article className={`ride-card ${inactive ? "inactive" : ""}`}>
      <div className="ride-top">
        <span className="route-tag" title={routeLabel(ride)}>
          <Plane size={13} />
          <span>{routeLabel(ride)}</span>
        </span>
        <span className={`seat-tag ${inactive ? "neutral" : ""}`}>
          <span className="live-dot" />
          {ride.status === "CANCELLED"
            ? "Cancelled"
            : inactive
              ? "Completed"
              : `${ride.capacity - ride.occupied} seat${ride.capacity - ride.occupied !== 1 ? "s" : ""} available`}
        </span>
      </div>
      <div className="ride-time">
        <div>
          <span className="micro-label">
            {toCampus ? "FLIGHT ARRIVAL" : "FLIGHT DEPARTURE"}
          </span>
          <h3>
            {timeLabel(ride.flightAt)}
            <span>{dateLabel(ride.flightAt)}</span>
          </h3>
        </div>
        <Plane className="flight-icon" size={25} strokeWidth={1.5} />
      </div>
      {ride.pickupAt && (
        <div className="pickup">
          <MapPin size={15} />
          <span>{toCampus ? "Airport pickup" : "Campus pickup"}</span>
          <strong>
            {timeLabel(ride.pickupAt)} · {dateLabel(ride.pickupAt)}
          </strong>
        </div>
      )}
      <div className="ride-host">
        <span className={`avatar color-${ride.creator.id % 4}`}>
          {initials(ride.creator.name)}
        </span>
        <div>
          <strong>
            {ride.creator.name}
            {own ? " (you)" : ""}
          </strong>
          <span>{ride.creator.blockNumber}</span>
        </div>
        <a
          className="icon-button call"
          href={`tel:${ride.creator.phone}`}
          aria-label={`Call ${ride.creator.name}`}
        >
          <Phone size={17} />
        </a>
      </div>
      <div className="ride-note">
        {ride.notes ||
          "A shared ride, a lighter fare. Get in touch to plan the details."}
      </div>
      <button
        className="passengers"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Users size={16} />
        <span>
          <strong>
            {ride.occupied}/{ride.capacity}
          </strong>{" "}
          people in this cab
        </span>
        <ChevronDown size={16} className={expanded ? "rotate" : ""} />
      </button>
      {expanded && (
        <div className="member-list">
          {ride.members.map((m) => (
            <div key={m.id}>
              <span>
                {m.name}
                <small>{m.blockNumber}</small>
              </span>
              <a href={`tel:${m.phone}`}>{m.phone}</a>
            </div>
          ))}
        </div>
      )}
      <div className="ride-action">
        {own ? (
          <>
            <span className="your-cab">
              <CheckCircle2 size={15} /> Your cab
            </span>
            {!inactive && (
              <button
                className="text-button danger-text"
                onClick={() => onCancel(ride)}
              >
                Cancel ride
              </button>
            )}
          </>
        ) : (
          <Button
            className={
              status === "ACCEPTED"
                ? "accepted"
                : status
                  ? "secondary"
                  : "outline"
            }
            busy={busy}
            disabled={!!status || inactive}
            onClick={() => onJoin(ride.id)}
          >
            {status === "PENDING" ? (
              <>
                <Clock3 size={16} /> Request sent
              </>
            ) : status === "ACCEPTED" ? (
              <>
                <Check size={16} /> You’re in!
              </>
            ) : status === "REJECTED" ? (
              "Request declined"
            ) : status === "CANCELLED" ? (
              "Ride cancelled"
            ) : inactive ? (
              "Ride unavailable"
            ) : (
              <>
                Request to join <ArrowUpRight size={17} />
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
function Empty({ icon: Icon = Search, title, text, action }) {
  return (
    <div className="empty">
      <span>
        <Icon size={30} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Dashboard({ user, setUser, onLogout, toast }) {
  const [page, setPage] = useState("find"),
    [date, setDate] = useState(tomorrow()),
    [time, setTime] = useState("12:00"),
    [routeId, setRouteId] = useState(ROUTES[0].id),
    [rides, setRides] = useState([]),
    [myRides, setMyRides] = useState([]),
    [requests, setRequests] = useState([]),
    [notices, setNotices] = useState([]),
    [searched, setSearched] = useState(false),
    [searching, setSearching] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(null),
    [mobileNav, setMobileNav] = useState(false),
    [showNotices, setShowNotices] = useState(false),
    [requestTab, setRequestTab] = useState("incoming");
  const route = ROUTES.find((route) => route.id === routeId);
  const toCampus = isToCampus(route);
  const searchRef = useRef(null);
  const searchVersion = useRef(0);
  function changeSearch(setter, value) {
    setter(value);
    searchVersion.current++;
    searchRef.current = null;
    setSearched(false);
    setSearching(false);
    setRides([]);
  }
  const pending = requests.filter(
    (q) => q.incoming && q.status === "PENDING",
  ).length;
  const unread = notices.filter((n) => !n.read).length;
  async function refresh() {
    const [mine, req, not] = await Promise.all([
      api.mine(),
      api.requests(),
      api.notices(),
    ]);
    setMyRides(mine.filter((r) => r.status !== "CANCELLED"));
    setRequests(req);
    setNotices(not);
  }
  async function search(e) {
    e?.preventDefault();
    const query = {
      flightAt: localInstant(date, time),
      origin: route.origin,
      destination: route.destination,
    };
    const version = ++searchVersion.current;
    setSearching(true);
    setError("");
    try {
      const results = await api.search(
        query.flightAt,
        query.destination,
        query.origin,
      );
      if (version !== searchVersion.current) return;
      setRides(results);
      searchRef.current = query;
      setSearched(true);
    } catch (e) {
      if (version === searchVersion.current) setError(e.message);
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  }
  async function refreshResults() {
    const query = searchRef.current;
    if (!query) return;
    const results = await api.search(
      query.flightAt,
      query.destination,
      query.origin,
    );
    if (searchRef.current === query) setRides(results);
  }
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        await refresh();
      } catch (e) {
        if (live) setError(e.message);
      } finally {
        if (live) setLoading(false);
      }
    }
    load();
    const id = setInterval(() => {
      refresh()
        .then(refreshResults)
        .catch((e) => {
          if (live) setError(e.message);
        });
    }, 15000);
    const storage = () =>
      load()
        .then(refreshResults)
        .catch((e) => setError(e.message));
    window.addEventListener("storage", storage);
    return () => {
      live = false;
      clearInterval(id);
      window.removeEventListener("storage", storage);
    };
  }, []);
  async function join(id) {
    setBusy(`join-${id}`);
    try {
      await api.join(id);
      await Promise.all([refresh(), refreshResults()]);
      toast("Request sent. We’ll let you know when the host responds.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  async function decide(id, accept) {
    setBusy(`request-${id}`);
    try {
      await api.decide(id, accept);
      await Promise.all([refresh(), refreshResults()]);
      toast(
        accept
          ? "A new travel buddy. Request accepted!"
          : "Request declined. The student has been notified.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  const go = (p) => {
    setPage(p);
    setMobileNav(false);
    setError("");
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <Logo />
        <div className="sidebar-section">YOUR TRAVEL SPACE</div>
        <nav className="side-nav">
          {[
            { id: "find", icon: Search, label: "Find a cab" },
            { id: "rides", icon: CarFront, label: "My rides" },
            { id: "requests", icon: Inbox, label: "Requests", count: pending },
          ].map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {!!count && <b>{count}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            onClick={() => {
              setModal("profile");
              setMobileNav(false);
            }}
          >
            <span className="avatar">{initials(user.name)}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.blockNumber}</small>
            </span>
            <UserRound size={17} />
          </button>
          <button className="logout" onClick={onLogout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      {mobileNav && (
        <div className="nav-scrim" onClick={() => setMobileNav(false)} />
      )}
      <div className="app-main">
        <header className="app-header">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Your campus <span>/</span>{" "}
              <strong>
                {page === "find"
                  ? "Find a cab"
                  : page === "rides"
                    ? "My rides"
                    : "Requests"}
              </strong>
            </span>
          </div>
          <div className="header-right">
            <span className="local-time">
              <span className="live-dot" />
              {DEMO ? "Demo campus" : "Campus connected"}
            </span>
            <div className="notifications-wrap">
              <button
                className="icon-button notification-button"
                aria-label={`Notifications, ${unread} unread`}
                aria-expanded={showNotices}
                onClick={async () => {
                  setShowNotices(!showNotices);
                  if (!showNotices) {
                    try {
                      await api.readNotices();
                      await refresh();
                    } catch (e) {
                      setError(e.message);
                    }
                  }
                }}
              >
                <Bell size={20} />
                {unread > 0 && <span className="notification-dot" />}
              </button>
              {showNotices && (
                <>
                  <div
                    className="popover-scrim"
                    onClick={() => setShowNotices(false)}
                  />
                  <section className="notification-panel">
                    <div className="notification-title">
                      <strong>Notifications</strong>
                      <button
                        className="icon-button"
                        onClick={() => setShowNotices(false)}
                        aria-label="Close notifications"
                      >
                        <X size={17} />
                      </button>
                    </div>
                    {notices.length ? (
                      notices.map((n) => (
                        <button
                          className="notice"
                          key={n.id}
                          onClick={() => {
                            go("requests");
                            setShowNotices(false);
                          }}
                        >
                          <span>
                            <Bell size={16} />
                          </span>
                          <div>
                            <p>{n.message}</p>
                            <small>
                              {dateLabel(n.createdAt)} ·{" "}
                              {timeLabel(n.createdAt)}
                            </small>
                          </div>
                          <ArrowUpRight size={16} />
                        </button>
                      ))
                    ) : (
                      <p className="notification-empty">
                        You’re all caught up. Ride updates will appear here.
                      </p>
                    )}
                  </section>
                </>
              )}
            </div>
            <span className="avatar header-avatar">{initials(user.name)}</span>
          </div>
        </header>
        {DEMO && (
          <div className="demo-banner app-demo">
            <Info size={13} />
            <span>
              Interactive demo · sample data saved in this browser.{" "}
              <button onClick={() => setModal("demo")}>
                How to test requests <ArrowUpRight size={12} />
              </button>
            </span>
          </div>
        )}
        <main className="dashboard-content">
          <div className="page-heading">
            <div>
              {page !== "find" && (
                <p className="eyebrow">
                  {page === "rides"
                    ? "YOUR JOURNEYS, TOGETHER"
                    : "A LITTLE MORE COMPANY"}
                </p>
              )}
              <h1>
                {page === "find" ? (
                  <>
                    Find your <em>airport crew.</em>
                  </>
                ) : page === "rides" ? (
                  <>
                    Your rides. <em>All in one place.</em>
                  </>
                ) : (
                  <>
                    Good journeys <em>start here.</em>
                  </>
                )}
              </h1>
              {page !== "find" && (
                <p>
                  {page === "rides"
                    ? "Cabs you’re hosting and rides you’ve joined."
                    : "Manage your incoming requests and keep track of the ones you’ve sent."}
                </p>
              )}
            </div>
            <Button onClick={() => setModal("post")}>
              <Plus size={18} /> Post a cab
            </Button>
          </div>
          <ErrorText message={error} />
          {page === "find" && (
            <>
              <section className="search-panel">
                <div className="search-intro">
                  <span>
                    <Search size={18} />
                  </span>
                  <strong>
                    {toCampus
                      ? "When does your flight arrive?"
                      : "When’s your flight?"}
                  </strong>
                </div>
                <form className="search-form" onSubmit={search}>
                  <div className="search-direction">
                    <RouteDirection
                      value={routeId}
                      onChange={(value) => changeSearch(setRouteId, value)}
                    />
                  </div>
                  <Field
                    label={
                      toCampus ? "Flight arrival date" : "Flight departure date"
                    }
                  >
                    <div className="input-icon">
                      <CalendarDays size={18} />
                      <input
                        aria-label={
                          toCampus
                            ? "Flight arrival date"
                            : "Flight departure date"
                        }
                        type="date"
                        required
                        value={date}
                        onChange={(e) => changeSearch(setDate, e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field
                    label={
                      toCampus ? "Flight arrival time" : "Flight departure time"
                    }
                  >
                    <div className="input-icon">
                      <Clock3 size={18} />
                      <input
                        aria-label={
                          toCampus
                            ? "Flight arrival time"
                            : "Flight departure time"
                        }
                        type="time"
                        required
                        value={time}
                        onChange={(e) => changeSearch(setTime, e.target.value)}
                      />
                    </div>
                  </Field>
                  <Button type="submit" busy={searching}>
                    <Search size={17} /> Find a cab
                  </Button>
                </form>
              </section>
              <div className="results-heading">
                <h2>
                  {searched
                    ? "Your possible travel buddies"
                    : "Let’s find your way home"}
                  {searched && <span className="count">{rides.length}</span>}
                </h2>
                <span>
                  {searched
                    ? "Closest flight times first"
                    : "A shared ride is a search away"}
                </span>
              </div>
              {searching ? (
                <div className="loading">
                  <LoaderCircle className="spin" />
                  Finding your crew…
                </div>
              ) : searched && rides.length ? (
                <div className="rides-grid">
                  {rides.map((r) => (
                    <RideCard
                      key={r.id}
                      ride={r}
                      user={user}
                      onJoin={join}
                      onCancel={(r) => setModal({ cancel: r })}
                      busy={busy === `join-${r.id}`}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={searched ? CarFront : Plane}
                  title={
                    searched
                      ? "No cabs around that time. Yet."
                      : "Your flight. Your people."
                  }
                  text={
                    searched
                      ? "Try another flight time or route, or start a ride and let your crew find you."
                      : "Tell us when you’re flying. We’ll connect you with students heading the same way."
                  }
                  action={
                    searched ? (
                      <Button
                        className="outline"
                        onClick={() => setModal("post")}
                      >
                        <Plus size={16} /> Be the first to post
                      </Button>
                    ) : null
                  }
                />
              )}
            </>
          )}
          {page === "rides" && (
            <>
              <div className="results-heading">
                <h2>
                  Your travel plans{" "}
                  <span className="count">{myRides.length}</span>
                </h2>
                <span>Created by you or confirmed by your host</span>
              </div>
              {loading ? (
                <div className="loading">
                  <LoaderCircle className="spin" />
                  Loading rides…
                </div>
              ) : myRides.length ? (
                <div className="rides-grid">
                  {myRides.map((r) => (
                    <RideCard
                      key={r.id}
                      ride={r}
                      user={user}
                      onJoin={join}
                      onCancel={(r) => setModal({ cancel: r })}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={CarFront}
                  title="Your next journey starts here."
                  text="Post a cab or request to join one. Confirmed rides will show up here."
                  action={
                    <Button className="outline" onClick={() => go("find")}>
                      Find a cab <ArrowRight size={16} />
                    </Button>
                  }
                />
              )}
            </>
          )}
          {page === "requests" && (
            <>
              <div className="tabs">
                <button
                  className={requestTab === "incoming" ? "active" : ""}
                  onClick={() => setRequestTab("incoming")}
                >
                  Incoming{" "}
                  <span>{requests.filter((q) => q.incoming).length}</span>
                </button>
                <button
                  className={requestTab === "outgoing" ? "active" : ""}
                  onClick={() => setRequestTab("outgoing")}
                >
                  Sent by you{" "}
                  <span>{requests.filter((q) => !q.incoming).length}</span>
                </button>
              </div>
              {requests.filter(
                (q) => q.incoming === (requestTab === "incoming"),
              ).length ? (
                <div className="request-list">
                  {requests
                    .filter((q) => q.incoming === (requestTab === "incoming"))
                    .map((q) => (
                      <article className="request-card" key={q.id}>
                        <span className="avatar">
                          {initials(q.student.name)}
                        </span>
                        <div className="request-info">
                          <strong>
                            {q.incoming
                              ? q.student.name
                              : `Your request: ${routeLabel(q)}`}
                          </strong>
                          <span>
                            {q.incoming
                              ? `${q.student.blockNumber} · ${q.student.phone}`
                              : "Waiting for a great shared journey."}
                          </span>
                          <p>
                            <Plane size={14} /> {routeLabel(q)} <span>·</span>{" "}
                            {isToCampus(q) ? "Arrival" : "Departure"}{" "}
                            {dateLabel(q.flightAt)}, {timeLabel(q.flightAt)}
                          </p>
                        </div>
                        {q.incoming && q.status === "PENDING" ? (
                          <div className="request-actions">
                            <Button
                              className="outline"
                              busy={busy === `request-${q.id}`}
                              onClick={() => decide(q.id, false)}
                            >
                              Decline
                            </Button>
                            <Button
                              busy={busy === `request-${q.id}`}
                              onClick={() => decide(q.id, true)}
                            >
                              <Check size={16} /> Accept
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={`status-badge ${q.status.toLowerCase()}`}
                          >
                            {q.status === "PENDING"
                              ? "Awaiting response"
                              : q.status === "ACCEPTED"
                                ? "Accepted"
                                : q.status === "REJECTED"
                                  ? "Declined"
                                  : "Cancelled"}
                          </span>
                        )}
                      </article>
                    ))}
                </div>
              ) : (
                <Empty
                  icon={Inbox}
                  title={
                    requestTab === "incoming"
                      ? "Your crew hasn’t knocked. Yet."
                      : "No requests sent just yet."
                  }
                  text={
                    requestTab === "incoming"
                      ? "When someone wants to join a cab you posted, you can accept or decline them here."
                      : "Find a cab that fits your flight and request a seat. You’ll see its status here."
                  }
                />
              )}
            </>
          )}
          {page !== "find" && (
            <footer className="dashboard-footer">
              <span>
                campuscab. <span>Better, together.</span>
              </span>
              <span>
                <Leaf size={13} /> Share the ride. Lighten the footprint.
              </span>
            </footer>
          )}
        </main>
      </div>
      {modal === "profile" && (
        <ProfileForm
          user={user}
          onClose={() => setModal(null)}
          onSave={(u) => {
            setUser(u);
            setModal(null);
            toast("Profile updated.");
          }}
        />
      )}
      {modal === "post" && (
        <PostForm
          initialRouteId={routeId}
          onClose={() => setModal(null)}
          onCreated={async () => {
            setModal(null);
            go("rides");
            try {
              await refresh();
              toast("Your cab is posted. Let the crew come to you!");
            } catch (e) {
              setError(e.message);
            }
          }}
        />
      )}
      {modal?.cancel && (
        <Modal
          title="Cancel this ride?"
          subtitle="All pending and accepted passengers will be notified. They’ll need to find another cab."
          onClose={() => setModal(null)}
        >
          <div className="confirm-actions">
            <Button className="outline" onClick={() => setModal(null)}>
              Keep my ride
            </Button>
            <Button
              className="danger"
              busy={busy === "cancel"}
              onClick={async () => {
                setBusy("cancel");
                try {
                  await api.cancel(modal.cancel.id);
                  setMyRides((current) =>
                    current.filter((r) => r.id !== modal.cancel.id),
                  );
                  setRides((current) =>
                    current.filter((r) => r.id !== modal.cancel.id),
                  );
                  setModal(null);
                  await Promise.all([refresh(), refreshResults()]);
                  toast("Ride cancelled. Your passengers have been notified.");
                } catch (e) {
                  setError(e.message);
                  setModal(null);
                } finally {
                  setBusy(null);
                }
              }}
            >
              Cancel ride
            </Button>
          </div>
        </Modal>
      )}
      {modal === "demo" && (
        <Modal
          title="Take both seats in the demo."
          subtitle="Try the complete request and approval flow in this browser."
          onClose={() => setModal(null)}
        >
          <ol className="demo-instructions">
            <li>
              Search for tomorrow at 12:00, destination <b>Airport</b>.
            </li>
            <li>Request to join Ananya’s cab.</li>
            <li>
              Sign out, then sign in as <b>+91 9000000101</b> with code{" "}
              <b>123456</b>.
            </li>
            <li>
              Open <b>Requests</b> and accept. Sign back into your original
              number to see the confirmation.
            </li>
          </ol>
          <p className="muted small-text">
            Sample names and phone numbers are fictional. All demo data stays in
            this browser; no texts or notifications are sent outside this app.
          </p>
          <Button className="full" onClick={() => setModal(null)}>
            Got it <Check size={17} />
          </Button>
        </Modal>
      )}
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [booting, setBooting] = useState(true),
    [toast, setToast] = useState("");
  const toastTimer = useRef();
  function notify(text) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 5500);
  }
  useEffect(() => {
    let active = true;
    api
      .me()
      .then((u) => {
        if (active) setUser(u);
      })
      // Visitors without a session start at the phone login form.
      .catch(() => {})
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
      clearTimeout(toastTimer.current);
    };
  }, []);
  if (booting)
    return (
      <div className="boot">
        <Logo />
        <LoaderCircle className="spin" />
      </div>
    );
  return (
    <>
      {!user && <CursorGlow />}
      {!user ? (
        <Landing onLogin={setUser} />
      ) : !complete(user) ? (
        <div className="onboarding">
          <header>
            <Logo />
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.logout();
                  setUser(null);
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              Sign out
            </button>
          </header>
          <div className="onboarding-art">
            <TaxiArt />
          </div>
          <ProfileForm user={user} first onSave={setUser} />
        </div>
      ) : (
        <Dashboard
          user={user}
          setUser={setUser}
          toast={notify}
          onLogout={async () => {
            try {
              await api.logout();
              setUser(null);
              notify("You’re signed out. Safe travels!");
            } catch (e) {
              notify(e.message);
            }
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
