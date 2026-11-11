import { ArrowRight, CalendarDays, Clock3, Phone, Users } from "lucide-react";
import { CAMPUS, isToCampus, rideDeadline } from "./routes";
import "./cab-details.css";

export function cabAvailability(ride) {
  const seats = Math.max(0, ride.capacity - ride.occupied);
  const active =
    ride.status === "OPEN" && new Date(rideDeadline(ride)) > new Date();
  return { seats, available: active && seats > 0, active };
}

export default function CabDetails({ ride, onSelect }) {
  const { seats, available, active } = cabAvailability(ride);
  return (
    <article
      className={`cab-details${onSelect ? " selectable" : ""}`}
      aria-label="Cab details"
    >
      <CabRoute ride={ride} />
      <p className={`cab-seats ${available ? "available" : "unavailable"}`}>
        <Users size={20} aria-hidden="true" />
        {ride.status === "CANCELLED"
          ? "No seats available · Cancelled"
          : !active
            ? "No seats available · Completed"
            : `${seats} seat${seats !== 1 ? "s" : ""} available`}
      </p>
      <CabFlight ride={ride} />
      <div className="cab-host">
        <span className="cab-label">Host</span>
        <strong>{ride.creator.name}</strong>
        <a href={`tel:${ride.creator.phone}`}>
          <Phone size={17} aria-hidden="true" /> {ride.creator.phone}
        </a>
      </div>
      {onSelect && (
        <button
          type="button"
          className="cab-select"
          aria-label={`Request to join ${ride.creator.name}’s cab from ${ride.origin ?? CAMPUS} to ${ride.destination}`}
          aria-haspopup="dialog"
          onClick={onSelect}
        />
      )}
    </article>
  );
}

function CabRoute({ ride }) {
  return (
    <h3 className="cab-route">
      <span>{ride.origin ?? CAMPUS}</span>
      <ArrowRight size={22} aria-label="to" />
      <span>{ride.destination}</span>
    </h3>
  );
}

function CabFlight({ ride }) {
  const flight = new Date(ride.flightAt);
  return (
    <div className="cab-flight">
      <div>
        <span className="cab-label">
          <CalendarDays size={16} aria-hidden="true" /> Flight date
        </span>
        <time dateTime={ride.flightAt}>
          {flight.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
      <div>
        <span className="cab-label">
          <Clock3 size={16} aria-hidden="true" />
          {isToCampus(ride) ? "Flight arrival" : "Flight departure"}
        </span>
        <time dateTime={ride.flightAt}>
          {flight.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}

export function RequestCabDetails({ request, knownRides = [] }) {
  const ride =
    request.ride ?? knownRides.find((ride) => ride.id === request.rideId);
  if (ride) return <CabDetails ride={ride} />;

  // Older backend responses contain route and flight fields directly on requests.
  // Keep these details and the request controls usable until full ride data arrives.
  return (
    <article className="cab-details" aria-label="Cab details">
      <CabRoute ride={request} />
      <CabFlight ride={request} />
      <p className="muted">Additional cab details are unavailable.</p>
    </article>
  );
}
