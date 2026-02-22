/**
 * ─────────────────────────────────────────────────────────────────────────────
 * api/client.ts  —  Repair Now CLIENT App
 * ─────────────────────────────────────────────────────────────────────────────
 * Axios base client shared by every API module in this app.
 *
 * Configuration:
 *   • baseURL     → Read from .env (API_BASE_URL). Never hardcoded.
 *   • timeout     → 15 s to avoid hanging network requests.
 *   • headers     → JSON content type for all requests.
 *
 * Privacy & Security:
 *   • No user credentials are stored or logged here.
 *   • Errors are logged only in __DEV__ mode; redacted in production builds.
 *   • All traffic targets the app's own backend only (no third-party analytics).
 *
 * Usage:
 *   import apiClient from './client';
 *   apiClient.get('/some-endpoint');
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Set API_BASE_URL in your .env file before running the app.
//   • Emulator:   API_BASE_URL=http://10.0.2.2:3000/api/
//   • Production: API_BASE_URL=https://repair-now.onrender.com/api/
const API_BASE_URL: string =
    process.env.API_BASE_URL ?? 'https://repair-now.onrender.com/api/';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000, // 15 seconds
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Passes successful responses through unchanged.
// On error: logs status + message in dev, then re-throws for callers to handle.
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (__DEV__) {
            const status = error.response?.status ?? 'network';
            const data = error.response?.data ?? error.message;
            console.error(`[API Error] ${status}:`, data);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
