const LOCAL_USER_KEY = "user";
const SESSION_USER_KEY = "expense_session_user";

const parseJson = (value) => {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
};

const removeLegacyProfileKeys = () => {
  Object.keys(localStorage)
    .filter((key) => key === "expense_user_profile" || key.startsWith("expense_user_profile_"))
    .forEach((key) => localStorage.removeItem(key));
};

export const getStoredUserId = () => {
  const localUser = parseJson(localStorage.getItem(LOCAL_USER_KEY));
  return localUser?.id || localUser?._id || "";
};

export const getSessionUser = () => {
  const sessionUser = parseJson(sessionStorage.getItem(SESSION_USER_KEY));
  const id = getStoredUserId();

  return {
    id,
    name: sessionUser?.name || "User",
    email: sessionUser?.email || "",
  };
};

export const storeAuthenticatedUser = (user = {}) => {
  const id = user.id || user._id || "";

  if (id) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ id }));
  }

  sessionStorage.setItem(
    SESSION_USER_KEY,
    JSON.stringify({
      id,
      name: user.name || "User",
      email: user.email || "",
    }),
  );
};

export const protectLocalUserPrivacy = () => {
  removeLegacyProfileKeys();

  const localUser = parseJson(localStorage.getItem(LOCAL_USER_KEY));
  const id = localUser?.id || localUser?._id || "";

  if (!id) return;

  const existingSession = parseJson(sessionStorage.getItem(SESSION_USER_KEY));
  if (!existingSession) {
    sessionStorage.setItem(
      SESSION_USER_KEY,
      JSON.stringify({
        id,
        name: localUser?.name || "User",
        email: localUser?.email || "",
      }),
    );
  }

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ id }));
};

export const clearAuthStorage = () => {
  removeLegacyProfileKeys();
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem(LOCAL_USER_KEY);
  sessionStorage.clear();
};
