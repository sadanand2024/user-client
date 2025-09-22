import jwtDecode from "https://esm.sh/jwt-decode";

let cachedUser = null;
let fetchInProgress = null;
let apiBase = null;

export function setApiBase(url) {
  apiBase = url.replace(/\/+$/, "");
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

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

async function fetchUserFromAPI() {
  if (!apiBase) throw new Error("API base not configured. Call setApiBase(url) first.");

  const res = await fetch(`${apiBase}/user_management/user/contexts/`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}

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
