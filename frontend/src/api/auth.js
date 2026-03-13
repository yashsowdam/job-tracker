export const TOKEN_KEYS = {
    access: "access_token",
    refresh: "refresh_token",
};

export function getAccessToken() {
    return localStorage.getItem(TOKEN_KEYS.access);
}

export function getRefreshToken() {
    return localStorage.getItem(TOKEN_KEYS.refresh);
}

export function setTokens({ access, refresh }) {
    if (access) localStorage.setItem(TOKEN_KEYS.access, access);
    if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}

export function clearTokens() {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
}

export function isLoggedIn() {
    return Boolean(getAccessToken());
}