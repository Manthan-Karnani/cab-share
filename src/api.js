import { createDemoApi } from "./demo";
import { CAMPUS } from "./routes";
export const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
let csrf;
const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
async function request(path, method = "GET", body) {
  if (method !== "GET" && !csrf) csrf = await request("/auth/csrf");
  let res;
  try {
    res = await fetch(`${base}/api${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { [csrf.headerName]: csrf.token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw Error(
      "Cannot reach the server. Check that the Java backend is running.",
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = Error(
      data?.message ||
        "The server could not complete this request. Please try again.",
    );
    e.status = res.status;
    throw e;
  }
  if (res.headers.get("content-type") && !data && res.status !== 204)
    throw Error("The Java API is not connected. Start the backend and reload.");
  return data;
}
const real = {
  config: () => request("/config"),
  me: () => request("/me"),
  sendOtp: (phone) => request("/auth/otp", "POST", { phone }),
  verifyOtp: (code) => request("/auth/verify", "POST", { code }),
  profile: (body) => request("/me", "PUT", body),
  search: (flightAt, destination, origin = CAMPUS) =>
    request(`/rides?${new URLSearchParams({ flightAt, destination, origin })}`),
  create: (body) => request("/rides", "POST", body),
  mine: () => request("/rides/mine"),
  join: (id) => request(`/rides/${id}/requests`, "POST"),
  requests: () => request("/requests"),
  decide: (id, accept) => request(`/requests/${id}`, "PUT", { accept }),
  cancel: (id) => request(`/rides/${id}`, "DELETE"),
  notices: () => request("/notifications"),
  readNotices: () => request("/notifications/read", "PUT"),
  logout: async () => {
    await request("/auth/logout", "POST");
    csrf = null;
  },
};
export const api = DEMO ? createDemoApi() : real;
