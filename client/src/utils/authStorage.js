const USER_STORAGE_KEY = "user";
const ORG_STORAGE_KEY = "organization";
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

  // Auth response me organization ho to wo bhi store karo
  const organization = user?.organization;
  if (organization?.id || organization?._id) {
    localStorage.setItem(
      ORG_STORAGE_KEY,
      JSON.stringify({
        id: organization.id || organization._id,
        name: organization.name || "",
      })
    );
  }

  return normalizedUser;
};

export const getStoredOrganization = () => {
  try {
    return JSON.parse(localStorage.getItem(ORG_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ORG_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};
