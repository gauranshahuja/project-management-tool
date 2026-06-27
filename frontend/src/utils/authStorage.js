import { getEntityId } from "./ids";

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
    id: getEntityId(user),
    _id: getEntityId(user),
  };
};

const normalizeOrganization = (value) => {
  const organization = value?.organization || value;

  if (!organization?.id && !organization?._id) {
    return null;
  }

  return {
    id: getEntityId(organization),
    _id: getEntityId(organization),
    name: organization.name || "",
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
  const normalizedOrganization = normalizeOrganization(
    user?.organization || normalizedUser?.organization
  );

  if (!normalizedUser) {
    clearStoredUser();
    return null;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);

  if (normalizedOrganization) {
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(normalizedOrganization));
  }

  return normalizedUser;
};

export const updateStoredUserProfile = (profile) => {
  const currentUser = getStoredUser();

  if (!currentUser) {
    return null;
  }

  return setStoredUser({
    user: {
      ...currentUser,
      ...profile,
      token: currentUser.token,
    },
    organization: profile?.organization || currentUser.organization,
  });
};

export const getStoredOrganization = () => {
  try {
    const storedOrganization = JSON.parse(
      localStorage.getItem(ORG_STORAGE_KEY) || "null"
    );
    const normalizedOrganization = normalizeOrganization(storedOrganization);

    if (!normalizedOrganization) {
      localStorage.removeItem(ORG_STORAGE_KEY);
      return null;
    }

    if (
      JSON.stringify(storedOrganization) !== JSON.stringify(normalizedOrganization)
    ) {
      localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(normalizedOrganization));
    }

    return normalizedOrganization;
  } catch {
    localStorage.removeItem(ORG_STORAGE_KEY);
    return null;
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ORG_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};
