import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // X-Requested-With is a custom header that browsers cannot set in
    // cross-site simple requests without CORS preflight. Combined with the
    // backend CORS allowedHeaders whitelist, this acts as a CSRF defense
    // layer for state-changing requests, even when Bearer tokens are used
    // (defense-in-depth, OWASP A01 / A05).
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Re-export auth header helper so it is available from a single import
export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
