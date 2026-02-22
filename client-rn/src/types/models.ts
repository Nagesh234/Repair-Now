/**
 * @file models.ts
 * @description Shared TypeScript type definitions for the Repair Now Client app.
 * These interfaces mirror the data shapes returned by the backend REST API.
 */

// ─── User ─────────────────────────────────────────────────────────────────────

/** Represents a registered user (client or partner). */
export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'client' | 'partner';
    phone_number?: string;
    avatar_url?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Response body returned by login / register / verify-otp endpoints. */
export interface AuthResponse {
    message: string;
    user?: User;
    error?: string;
}

/** Payload for the login endpoint. */
export interface LoginPayload {
    email: string;
    password: string;
}

/** Payload for the register endpoint. */
export interface RegisterPayload {
    email: string;
    password: string;
    full_name: string;
    role: 'client' | 'partner';
}

/** Payload for send-otp / verify-otp endpoints. */
export interface OtpPayload {
    email: string;
    phone_number?: string;
    code?: string;
}

/** Payload for updating the FCM push token on the server. */
export interface FcmTokenPayload {
    fcm_token: string;
}

/** Payload to check email/phone uniqueness before registration. */
export interface UniquenessPayload {
    email?: string;
    phone_number?: string;
}

// ─── Categories (Master Data) ───────────────────────────────────────────────────

/** Represents a standardized repair category from the backend. */
export interface Category {
    id: string;
    name: string;
    inspection_fee: number;
    image_url?: string;
}

/** Response fetching all master categories. */
export interface CategoryListResponse {
    categories?: Category[];
    error?: string;
}

// ─── Repair ───────────────────────────────────────────────────────────────────

/**
 * Represents a single repair request.
 * Used by both client (read) and partner (read/update) flows.
 */
export interface Repair {
    id: string;
    title: string;
    category_id?: string;
    category?: string; // Legacy fallback
    description: string;
    address: string;
    /** One of: 'pending' | 'accepted' | 'en_route' | 'diagnosing' | 'estimate_provided' | 'repairing' | 'completed' | 'cancelled' */
    status: string;
    estimated_cost?: number;
    final_cost?: number;
    created_at: string;
    /** The name of the assigned partner technician, if any. */
    partner_name?: string;
    /** Whether the repair has been rated by the client. */
    rated?: boolean;
}

/** Payload to create a new repair request. */
export interface CreateRepairPayload {
    client_id: string;
    title: string;
    category_id: string;
    description: string;
    address: string;
}

/** Generic multi-item repair list response from the API. */
export interface RepairListResponse {
    message: string;
    repairs?: Repair[];
    error?: string;
}

/** Single-item repair response (e.g. after accept / complete). */
export interface RepairResponse {
    message: string;
    repair?: Repair;
    error?: string;
}

/** Payload to give a 1–5 star rating to a completed repair. */
export interface RateRepairPayload {
    rating: number; // 1-5
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Shape of the user session stored locally in AsyncStorage. */
export interface UserSession {
    userId: string;
    email: string;
    name: string;
    role: string;
}
