// Explicit browser-only demo. The real API adapter never falls back to this data.
import { CAMPUS, isToCampus, rideDeadline } from "./routes.js";
export const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const localInstant = (date, time) =>
  new Date(`${date}T${time}:00`).toISOString();
export function seed() {
  const date = tomorrow();
  const users = [
    {
      id: 1,
      name: "Ananya Sharma",
      blockNumber: "B-3",
      phone: "+919000000101",
    },
    { id: 2, name: "Arjun Mehta", blockNumber: "A-2", phone: "+919000000102" },
    { id: 3, name: "Riya Patel", blockNumber: "C-1", phone: "+919000000103" },
    { id: 4, name: "Dev Shah", blockNumber: "B-1", phone: "+919000000104" },
  ];
  return {
    users,
    rides: [
      {
        id: 1,
        creatorId: 1,
        origin: CAMPUS,
        destination: "Airport",
        flightAt: localInstant(date, "12:00"),
        pickupAt: localInstant(date, "08:30"),
        capacity: 4,
        notes: "Meeting at the main gate. One suitcase each works best!",
        status: "OPEN",
      },
      {
        id: 2,
        creatorId: 2,
        origin: CAMPUS,
        destination: "Airport",
        flightAt: localInstant(date, "12:30"),
        pickupAt: localInstant(date, "09:00"),
        capacity: 4,
        notes: "Early birds welcome. Let’s split the fare equally.",
        status: "OPEN",
      },
      {
        id: 3,
        creatorId: 3,
        origin: CAMPUS,
        destination: "Airport",
        flightAt: localInstant(date, "11:15"),
        pickupAt: localInstant(date, "07:45"),
        capacity: 3,
        notes: "A little company for the ride home.",
        status: "OPEN",
      },
      {
        id: 4,
        creatorId: 4,
        origin: "Airport",
        destination: CAMPUS,
        flightAt: localInstant(date, "12:00"),
        pickupAt: localInstant(date, "12:30"),
        capacity: 4,
        notes: "Meet outside arrivals for the ride back to MIT Manipal.",
        status: "OPEN",
      },
    ],
    requests: [{ id: 1, rideId: 1, studentId: 4, status: "ACCEPTED" }],
    notices: [],
    nextId: 20,
  };
}
export function rideView(db, r, viewer) {
  const creator = db.users.find((u) => u.id === r.creatorId);
  const members = [
    creator,
    ...db.requests
      .filter((q) => q.rideId === r.id && q.status === "ACCEPTED")
      .map((q) => db.users.find((u) => u.id === q.studentId)),
  ];
  return {
    ...r,
    origin: r.origin ?? CAMPUS,
    creator,
    members,
    occupied: members.length,
    myRequestStatus:
      db.requests.find((q) => q.rideId === r.id && q.studentId === viewer)
        ?.status || null,
  };
}
export function searchRides(
  db,
  viewer,
  flightAt,
  destination,
  origin = CAMPUS,
) {
  return db.rides
    .map((r) => rideView(db, r, viewer))
    .filter(
      (r) =>
        r.status === "OPEN" &&
        new Date(rideDeadline(r)) > new Date() &&
        r.destination.toLowerCase() === destination.trim().toLowerCase() &&
        r.origin.toLowerCase() === origin.trim().toLowerCase() &&
        Math.abs(new Date(r.flightAt) - new Date(flightAt)) <= 3600000 &&
        r.occupied < r.capacity,
    )
    .sort(
      (a, b) =>
        Math.abs(new Date(a.flightAt) - new Date(flightAt)) -
        Math.abs(new Date(b.flightAt) - new Date(flightAt)),
    );
}
export function decideRequest(db, id, viewer, accept) {
  const q = db.requests.find((q) => q.id === id);
  if (!q) throw Error("Request not found.");
  const r = rideView(
    db,
    db.rides.find((r) => r.id === q.rideId),
    viewer,
  );
  if (r.creatorId !== viewer) throw Error("Only the creator can respond.");
  if (q.status !== "PENDING")
    throw Error("This request has already been answered.");
  if (r.status !== "OPEN" || new Date(rideDeadline(r)) <= new Date())
    throw Error("This ride is no longer available.");
  if (accept && r.occupied >= r.capacity) throw Error("This cab is full.");
  q.status = accept ? "ACCEPTED" : "REJECTED";
  db.notices.unshift({
    id: db.nextId++,
    studentId: q.studentId,
    rideId: r.id,
    message: `${r.creator.name} ${accept ? "accepted" : "declined"} your request to join the cab.`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
const KEY = "campus-cab-demo-v1";
export function createDemoApi(
  storage = localStorage,
  session = sessionStorage,
) {
  let pendingPhone;
  const read = () => {
    let d;
    try {
      d = JSON.parse(storage.getItem(KEY));
    } catch {}
    if (!d) {
      d = seed();
      storage.setItem(KEY, JSON.stringify(d));
    }
    return d;
  };
  const save = (d) => storage.setItem(KEY, JSON.stringify(d));
  const uid = () => Number(session.getItem("campus-cab-user"));
  const user = () => {
    const u = read().users.find((u) => u.id === uid());
    if (!u) {
      const e = Error("Please sign in.");
      e.status = 401;
      throw e;
    }
    return u;
  };
  const complete = () => {
    const u = user();
    if (!u.name?.trim() || !u.blockNumber?.trim())
      throw Error("Complete your profile first.");
    return u;
  };
  const mutate = (fn) => {
    const d = read();
    const result = fn(d);
    save(d);
    return result;
  };
  const viewRequest = (d, q) => {
    const r = d.rides.find((r) => r.id === q.rideId);
    return {
      ...q,
      student: d.users.find((u) => u.id === q.studentId),
      destination: r.destination,
      origin: r.origin ?? CAMPUS,
      flightAt: r.flightAt,
      pickupAt: r.pickupAt,
      incoming: r.creatorId === uid(),
    };
  };
  return {
    config: async () => ({ developmentOtp: true }),
    me: async () => user(),
    sendOtp: async (phone) => {
      if (!/^\+[1-9][0-9]{7,14}$/.test(phone))
        throw Error("Enter a valid international phone number.");
      pendingPhone = phone;
      return {
        developmentOtp: true,
        message: "Demo code: 123456. No SMS is sent.",
      };
    },
    verifyOtp: async (code) => {
      if (!pendingPhone) throw Error("Request a code first.");
      if (code !== "123456")
        throw Error("Incorrect code. Use 123456 in this demo.");
      return mutate((d) => {
        let u = d.users.find((u) => u.phone === pendingPhone);
        if (!u) {
          u = {
            id: d.nextId++,
            phone: pendingPhone,
            name: null,
            blockNumber: null,
          };
          d.users.push(u);
        }
        session.setItem("campus-cab-user", String(u.id));
        pendingPhone = null;
        return u;
      });
    },
    profile: async (body) => {
      user();
      return mutate((d) => {
        const u = d.users.find((u) => u.id === uid());
        Object.assign(u, body);
        return u;
      });
    },
    search: async (flight, destination, origin = CAMPUS) => {
      complete();
      return searchRides(read(), uid(), flight, destination, origin);
    },
    create: async (body) => {
      complete();
      const origin = (body.origin ?? CAMPUS).trim();
      const destination = body.destination.trim();
      const toCampus = isToCampus({ destination });
      if (
        !origin ||
        !destination ||
        toCampus === (origin.toLowerCase() === CAMPUS.toLowerCase())
      )
        throw Error(
          "Choose a route between an airport and MIT Manipal campus.",
        );
      const flight = new Date(body.flightAt);
      const pickup = body.pickupAt == null ? null : new Date(body.pickupAt);
      if (
        !Number.isInteger(body.capacity) ||
        body.capacity < 2 ||
        body.capacity > 8
      )
        throw Error("Cab capacity must be between 2 and 8, including you.");
      if (
        !Number.isFinite(+flight) ||
        (pickup !== null && !Number.isFinite(+pickup))
      )
        throw Error("Choose a valid flight time and pickup time.");
      if (pickup === null && flight <= new Date())
        throw Error("Flight departure or arrival must be in the future.");
      if (pickup !== null && pickup <= new Date())
        throw Error("Pickup must be in the future.");
      if (pickup !== null && (toCampus ? pickup < flight : pickup >= flight))
        throw Error(
          toCampus
            ? "Airport pickup must be at or after your flight arrival."
            : "Campus pickup must be before your flight departure.",
        );
      return mutate((d) => {
        const r = {
          ...body,
          pickupAt: body.pickupAt ?? null,
          notes: body.notes?.trim() ?? "",
          origin: toCampus ? origin : CAMPUS,
          destination: toCampus ? CAMPUS : destination,
          id: d.nextId++,
          creatorId: uid(),
          status: "OPEN",
        };
        d.rides.unshift(r);
        return rideView(d, r, uid());
      });
    },
    mine: async () => {
      complete();
      const d = read();
      return d.rides
        .filter(
          (r) =>
            r.status !== "CANCELLED" &&
            (r.creatorId === uid() ||
              d.requests.some(
                (q) =>
                  q.rideId === r.id &&
                  q.studentId === uid() &&
                  q.status === "ACCEPTED",
              )),
        )
        .map((r) => rideView(d, r, uid()));
    },
    join: async (id) => {
      const u = complete();
      return mutate((d) => {
        const r = rideView(
          d,
          d.rides.find((r) => r.id === id),
          uid(),
        );
        if (r.creatorId === uid()) throw Error("You are already the creator.");
        if (r.status !== "OPEN" || new Date(rideDeadline(r)) <= new Date())
          throw Error("This ride is no longer available.");
        if (r.occupied >= r.capacity) throw Error("This cab is full.");
        if (r.myRequestStatus)
          throw Error("You have already requested this ride.");
        const q = {
          id: d.nextId++,
          rideId: id,
          studentId: uid(),
          status: "PENDING",
        };
        d.requests.push(q);
        d.notices.unshift({
          id: d.nextId++,
          studentId: r.creatorId,
          rideId: id,
          message: `${u.name} wants to join your cab to ${r.destination}.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        return viewRequest(d, q);
      });
    },
    requests: async () => {
      complete();
      const d = read();
      return d.requests
        .filter(
          (q) =>
            q.studentId === uid() ||
            d.rides.find((r) => r.id === q.rideId)?.creatorId === uid(),
        )
        .map((q) => viewRequest(d, q))
        .reverse();
    },
    decide: async (id, accept) => {
      complete();
      return mutate((d) => decideRequest(d, id, uid(), accept));
    },
    cancel: async (id) => {
      complete();
      return mutate((d) => {
        const r = d.rides.find((r) => r.id === id);
        if (r.creatorId !== uid()) throw Error("Only the creator can cancel.");
        r.status = "CANCELLED";
        d.requests
          .filter(
            (q) =>
              q.rideId === id && ["PENDING", "ACCEPTED"].includes(q.status),
          )
          .forEach((q) => {
            q.status = "CANCELLED";
            d.notices.unshift({
              id: d.nextId++,
              studentId: q.studentId,
              rideId: id,
              message: "Your cab has been cancelled by the creator.",
              read: false,
              createdAt: new Date().toISOString(),
            });
          });
      });
    },
    notices: async () => {
      complete();
      return read().notices.filter((n) => n.studentId === uid());
    },
    readNotices: async () => {
      complete();
      return mutate((d) =>
        d.notices
          .filter((n) => n.studentId === uid())
          .forEach((n) => (n.read = true)),
      );
    },
    logout: async () => session.removeItem("campus-cab-user"),
  };
}
