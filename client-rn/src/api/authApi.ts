/**
 * ─────────────────────────────────────────────────────────────────────────────
 * api/authApi.ts  —  Repair Now CLIENT App
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication API functions covering the full client auth lifecycle:
 *   login → register → OTP verification → FCM token registration → profile update
 *
 * Privacy & Security:
 *   • Passwords are NEVER stored. They are passed in memory to the backend
 *     and immediately discarded after the HTTP response.
 *   • The server communicates over HTTPS in production (see AndroidManifest.xml).
 *   • This module never reads or writes AsyncStorage — that is sessionStore's job.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AxiosResponse } from 'axios';
import apiClient from './client';
import {
    AuthResponse,
    FcmTokenPayload,
    LoginPayload,
    OtpPayload,
    RegisterPayload,
    UniquenessPayload,
} from '../types/models';

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * Log in with email and password.
 * Returns the authenticated user object on success (200).
 */
export const login = (
    payload: LoginPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/login', payload);

/**
 * Register a new client account.
 * `role` must be set to `'client'` for this app.
 */
export const register = (
    payload: RegisterPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/register', payload);

// ─── Uniqueness Check ─────────────────────────────────────────────────────────

/**
 * Check whether an email or phone number is already registered.
 * Call before registration to show inline field errors early.
 *
 * @param payload - At least one of `email` or `phone_number` is required.
 * @returns 200 if unique; 409 with conflict messages if already in use.
 */
export const checkUniqueness = (
    payload: UniquenessPayload,
): Promise<AxiosResponse<Record<string, string>>> =>
    apiClient.post<Record<string, string>>('/auth/check-unique', payload);

// ─── One-Time Password (OTP) ──────────────────────────────────────────────────

/**
 * Send an OTP to the user's email address.
 * Used for both OTP-based login and registration verification.
 */
export const sendOtp = (
    payload: OtpPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/send-otp', payload);

/**
 * Verify the OTP submitted by the user.
 * On success (200), the response contains the user object to create a session.
 */
export const verifyOtp = (
    payload: OtpPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/verify-otp', payload);

// ─── Device Token ─────────────────────────────────────────────────────────────

/**
 * Register the device's FCM push token with the backend.
 * Called on every login and token-refresh from useFcmToken.
 * No personally identifiable information is stored in the FCM token.
 *
 * @param userId - The logged-in user's backend ID.
 * @param payload - The current FCM device token.
 */
export const updateFcmToken = (
    userId: string,
    payload: FcmTokenPayload,
): Promise<AxiosResponse<void>> =>
    apiClient.patch<void>(`/users/${userId}/fcm-token`, payload);

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Update the client's profile (name, phone, avatar).
 * Sends multipart/form-data because the avatar image is an optional file upload.
 * Avatar is selected via the system Photo Picker — no CAMERA permission needed.
 *
 * @param userId - The logged-in user's backend ID.
 * @param formData - Fields: full_name, phone_number, avatar (optional file).
 */
export const updateProfile = (
    userId: string,
    formData: FormData,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.put<AuthResponse>(`/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
