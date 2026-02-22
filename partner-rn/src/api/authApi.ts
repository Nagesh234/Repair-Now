/**
 * ─────────────────────────────────────────────────────────────────────────────
 * api/authApi.ts  —  Repair Now PARTNER App
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication API functions for partner technicians.
 * Identical contract to the client app, with `role` fixed to `'partner'`.
 *
 * Privacy: Passwords are never stored. They pass through memory only.
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

/** Log in a partner with email and password. */
export const login = (
    payload: LoginPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/login', payload);

/**
 * Register a new partner account.
 * Role is always `'partner'` — enforced by the backend as well.
 */
export const register = (
    payload: RegisterPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/register', payload);

// ─── Uniqueness Check ─────────────────────────────────────────────────────────

/**
 * Verify that email / phone are not already registered before submission.
 * Returns 200 if unique, 409 with field-level errors if taken.
 */
export const checkUniqueness = (
    payload: UniquenessPayload,
): Promise<AxiosResponse<Record<string, string>>> =>
    apiClient.post<Record<string, string>>('/auth/check-unique', payload);

// ─── One-Time Password (OTP) ──────────────────────────────────────────────────

/** Send an OTP to the partner's email for login or registration verification. */
export const sendOtp = (
    payload: OtpPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/send-otp', payload);

/** Verify the OTP. Returns user object on success for session creation. */
export const verifyOtp = (
    payload: OtpPayload,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/verify-otp', payload);

// ─── Device Token ─────────────────────────────────────────────────────────────

/**
 * Register the device's FCM token so the backend can send new-job notifications.
 * The FCM token contains no PII and is overwritten on each app start.
 *
 * @param userId - The partner's backend user ID.
 * @param payload - The current FCM device registration token.
 */
export const updateFcmToken = (
    userId: string,
    payload: FcmTokenPayload,
): Promise<AxiosResponse<void>> =>
    apiClient.patch<void>(`/users/${userId}/fcm-token`, payload);

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Update the partner's profile (name, phone, avatar).
 * Avatar upload uses multipart/form-data via the system Photo Picker
 * — no CAMERA or READ_MEDIA_IMAGES permission is required on API 33+.
 *
 * @param userId - The partner's backend user ID.
 * @param formData - Fields: full_name, phone_number, avatar (optional file).
 */
export const updateProfile = (
    userId: string,
    formData: FormData,
): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.put<AuthResponse>(`/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
