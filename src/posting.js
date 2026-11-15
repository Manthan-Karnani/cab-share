import { rideDeadline } from "./routes.js";

// Search before writing so a matching cab can be offered without posting a new one.
export async function prepareCabPost(api, userId, draft) {
  const flight = new Date(draft.flightAt);
  if (!Number.isFinite(+flight) || flight <= new Date()) {
    throw Error("Flight departure or arrival must be in the future.");
  }
  const rides = await api.search(
    draft.flightAt,
    draft.destination,
    draft.origin,
  );
  const matches = rides.filter(
    (ride) =>
      ride.creator.id !== userId &&
      !ride.myRequestStatus &&
      ride.status === "OPEN" &&
      new Date(rideDeadline(ride)) > new Date() &&
      ride.occupied < ride.capacity,
  );
  if (matches.length) return { matches };
  return { ride: await api.create(draft) };
}
