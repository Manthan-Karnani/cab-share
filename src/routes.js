export const CAMPUS = "MIT Manipal campus";

export const isToCampus = (ride) =>
  ride.destination.trim().toLowerCase() === CAMPUS.toLowerCase();

export const routeEndpoints = (toCampus, airport = "Airport") => ({
  origin: toCampus ? airport.trim() : CAMPUS,
  destination: toCampus ? CAMPUS : airport.trim(),
});

export const routeLabel = (ride) =>
  `${ride.origin ?? CAMPUS} → ${ride.destination}`;

export const rideDeadline = (ride) => ride.pickupAt ?? ride.flightAt;
