export const CAMPUS = "MIT Manipal campus";
export const KMC_CAMPUS = "KMC Manipal campus";
export const CAMPUSES = [CAMPUS, KMC_CAMPUS];

export const campusName = (name) =>
  CAMPUSES.find((campus) => campus.toLowerCase() === name.trim().toLowerCase());

export const isToCampus = (ride) => Boolean(campusName(ride.destination));

export const routeEndpoints = (
  toCampus,
  airport = "Airport",
  campus = CAMPUS,
) => ({
  origin: toCampus ? airport.trim() : campus,
  destination: toCampus ? campus : airport.trim(),
});

export const ROUTES = [
  { id: "mit-airport", ...routeEndpoints(false) },
  { id: "airport-mit", ...routeEndpoints(true) },
  { id: "kmc-airport", ...routeEndpoints(false, "Airport", KMC_CAMPUS) },
  { id: "airport-kmc", ...routeEndpoints(true, "Airport", KMC_CAMPUS) },
];

export const routeLabel = (ride) =>
  `${ride.origin ?? CAMPUS} → ${ride.destination}`;

export const rideDeadline = (ride) => ride.pickupAt ?? ride.flightAt;
