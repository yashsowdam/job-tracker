import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
});

// attach access token
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    pendingQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // no response / network error
        if (!error.response) return Promise.reject(error);

        // only handle 401 once per request
        if (error.response.status === 401 && !original._retry) {
            original._retry = true;

            const refresh = getRefreshToken();
            if (!refresh) {
                clearTokens();
                return Promise.reject(error);
            }

            // if already refreshing, queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            isRefreshing = true;

            try {
                // IMPORTANT: use a plain axios call to avoid recursion
                const resp = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/api/auth/token/refresh/`,
                    { refresh }
                );

                const newAccess = resp.data.access;
                setTokens({ access: newAccess });

                flushQueue(null, newAccess);

                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch (refreshErr) {
                flushQueue(refreshErr, null);
                clearTokens();
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;