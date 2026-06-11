const USER_STORAGE_KEY = "user";
const LEGACY_TOKEN_STORAGE_KEY = "token";

const normalizeAuthUser = (value) => {
  const user = value?.user || value;

  if (!user?.token) {
    return null;
  }

  return {
    ...user,
    id: user.id || user._id,
    _id: user._id || user.id,
  };
};

export const getStoredUser = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
    const normalizedUser = normalizeAuthUser(storedUser);

    if (!normalizedUser) {
      clearStoredUser();
      return null;
    }

    if (JSON.stringify(storedUser) !== JSON.stringify(normalizedUser)) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    }

    return normalizedUser;
  } catch {
    clearStoredUser();
    return null;
  }
};

export const setStoredUser = (user) => {
  const normalizedUser = normalizeAuthUser(user);

  if (!normalizedUser) {
    clearStoredUser();
    return null;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);

  return normalizedUser;
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};
