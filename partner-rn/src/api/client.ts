/**
 * ─────────────────────────────────────────────────────────────────────────────
 * api/client.ts  —  Repair Now PARTNER App
 * ─────────────────────────────────────────────────────────────────────────────
 * Axios base client shared by every API module in this app.
 *
 * Configuration:
 *   • baseURL  → Read from .env (API_BASE_URL). Never hardcoded.
 *   • timeout  → 15 s to avoid hanging network requests.
 *   • headers  → JSON content type for all requests.
 *
 * Privacy & Security:
 *   • No credentials are logged or persisted at this layer.
 *   • Errors are logged only in development (__DEV__). In production builds,
 *     the error is silently re-thrown for screens to handle.
 *   • All traffic targets only the Repair Now backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// Set API_BASE_URL in .env:
//   Emulator → http://10.0.2.2:3000/api/
//   Production → https://your-domain.com/api/
const API_BASE_URL: string =
    process.env.API_BASE_URL ?? 'http://10.0.2.2:3000/api/';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Log errors only in development; silently re-throw in production.
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (__DEV__) {
            const status = error.response?.status ?? 'network';
            const data = error.response?.data ?? error.message;
            console.error(`[Partner API Error] ${status}:`, data);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
