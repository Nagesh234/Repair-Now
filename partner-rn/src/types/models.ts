/**
 * @file models.ts
 * @description Shared TypeScript type definitions for the Repair Now Partner app.
 * These interfaces mirror the data shapes returned by the backend REST API.
 */

// ─── User ─────────────────────────────────────────────────────────────────────

/** Represents a registered partner technician. */
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

/** Payload for the register endpoint. Role is always 'partner' in this app. */
export interface RegisterPayload {
    email: string;
    password: string;
    full_name: string;
    role: 'partner';
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

/** Payload to check email/phone uniqueness. */
export interface UniquenessPayload {
    email?: string;
    phone_number?: string;
}

// ─── Repair ───────────────────────────────────────────────────────────────────

/**
 * Represents a repair job visible to the partner.
 * Includes the client's repair details plus assignment status.
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
}

/** Payload to update the status of a repair (e.g. estimate_provided -> repairing) */
export interface UpdateStatusPayload {
    status: string;
}

/** Payload to provide an estimate for a repair */
export interface ProvideEstimatePayload {
    estimated_cost: number;
}

/** Response for lists of repairs (pending, my-jobs). */
export interface RepairListResponse {
    message: string;
    repairs?: Repair[];
    kyc_pending?: boolean;
    error?: string;
}

/** Response when accepting or completing a repair. */
export interface RepairActionResponse {
    message: string;
    repair?: Repair;
    error?: string;
}

/** Payload to accept a repair (partner claims it). */
export interface AcceptRepairPayload {
    partner_id: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Shape of the partner session stored locally in AsyncStorage. */
export interface UserSession {
    userId: string;
    email: string;
    name: string;
    role: string;
}
