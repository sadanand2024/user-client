// user-client.js
import { jwtDecode } from "https://esm.sh/jwt-decode?exports=jwtDecode";

let cachedUser = null;
let fetchInProgress = null;
let apiBase = null; // We'll set this from outside

/**
 * Configure the base URL for API calls
 * @param {string} url - The base URL (e.g., http://localhost:8000 or https://auth.yourapp.com)
 */
export function setApiBase(url) {
  apiBase = url.replace(/\/+$/, ""); // remove trailing slash if present
}

/**
 * Helper: Read a cookie by name
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

/**
 * Get user details from JWT cookie (fast)
 */
function getUserFromCookie() {
  try {
    const token = getCookie("auth_token");
    if (!token) return null;
    return jwtDecode(token);
  } catch (e) {
    console.warn("Invalid token", e);
    return null;
  }
}

/**
 * Fetch fresh user details from /me API
 */
async function fetchUserFromAPI() {
  if (!apiBase) throw new Error("API base not configured. Call setApiBase(url) first.");

  const res = await fetch(`${apiBase}/user_management/user/contexts/`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}

/**
 * Public function to get current user
 */
export async function getCurrentUser({ refresh = false } = {}) {
  if (cachedUser && !refresh) return cachedUser;

  cachedUser = getUserFromCookie();

  if (!fetchInProgress) {
    fetchInProgress = fetchUserFromAPI()
      .then((data) => {
        cachedUser = data;
        return data;
      })
      .catch((err) => {
        console.error("Failed to fetch user from API:", err);
        return cachedUser;
      });
  }

  return fetchInProgress;
}
