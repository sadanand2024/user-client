// user-client.js
console.log("user-client.js loaded");
import { jwtDecode } from "https://esm.sh/jwt-decode?exports=jwtDecode";

let cachedUserContext = null;
let cachedUserDetails = null;
let contextFetchInProgress = null;
let detailsFetchInProgress = null;
let apiBase = null; // configured from outside

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
 * Fetch fresh user contexts from API
 */
async function fetchUserContextFromAPI() {
  if (!apiBase)
    throw new Error("API base not configured. Call setApiBase(url) first.");

  const res = await fetch(`${apiBase}/user_management/user/contexts/`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not logged in (contexts)");
  return res.json();
}

/**
 * Fetch fresh user details from API
 */
async function fetchUserDetailsFromAPI() {
  if (!apiBase)
    throw new Error("API base not configured. Call setApiBase(url) first.");

  const res = await fetch(`${apiBase}/user_management/users/`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not logged in (details)");
  return res.json();
}

/**
 * Public: Get current user context
 */
export async function getCurrentUserContext({ refresh = false } = {}) {
  if (cachedUserContext && !refresh) return cachedUserContext;

  cachedUserContext = getUserFromCookie();

  if (!contextFetchInProgress) {
    contextFetchInProgress = fetchUserContextFromAPI()
      .then((data) => {
        cachedUserContext = data;
        return data;
      })
      .catch((err) => {
        console.error("Failed to fetch user context:", err);
        return cachedUserContext;
      });
  }

  return contextFetchInProgress;
}

/**
 * Public: Get current user details
 */
export async function getCurrentUserDetails({ refresh = false } = {}) {
  if (cachedUserDetails && !refresh) return cachedUserDetails;

  if (!detailsFetchInProgress) {
    detailsFetchInProgress = fetchUserDetailsFromAPI()
      .then((data) => {
        cachedUserDetails = data;
        return data;
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err);
        return cachedUserDetails;
      });
  }

  return detailsFetchInProgress;
}

export function clearAuthCookie() {
  document.cookie =
    "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.tarafirst.com; Secure; SameSite=Strict";
  
  cachedUserContext = null;
  cachedUserDetails = null;
  contextFetchInProgress = null;
  detailsFetchInProgress = null;

  console.log("Auth cookie cleared from frontend new");
}