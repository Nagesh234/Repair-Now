/**
 * @file repairApi.ts
 * @description Repair job API calls for the Repair Now Partner app.
 *
 * Covers: fetching pending jobs, accepting a repair, fetching the
 * partner's own job list, and marking a repair as complete.
 */

import apiClient from './client';
import {
    AcceptRepairPayload,
    RepairActionResponse,
    RepairListResponse,
    UpdateStatusPayload,
    ProvideEstimatePayload,
} from '../types/models';
import { AxiosResponse } from 'axios';

/**
 * Fetch all repair requests that are still pending assignment (status = 'pending').
 * Displayed on the partner home screen as available jobs.
 * @param partnerId - Required for priority dispatch and KYC checks
 * @returns Axios response containing a {@link RepairListResponse}.
 */
export const getPendingRepairs = (
    partnerId: string,
): Promise<AxiosResponse<RepairListResponse>> =>
    apiClient.get<RepairListResponse>('repairs/pending', {
        params: { partner_id: partnerId },
    });

/**
 * Accept a specific repair request, assigning it to the logged-in partner.
 * @param repairId - The ID of the repair to accept.
 * @param payload - Contains the partner's user ID.
 * @returns Axios response containing a {@link RepairActionResponse} with updated repair.
 */
export const acceptRepair = (
    repairId: string,
    payload: AcceptRepairPayload,
): Promise<AxiosResponse<RepairActionResponse>> =>
    apiClient.patch<RepairActionResponse>(`repairs/${repairId}/accept`, payload);

/**
 * Update the status of a repair (e.g. to 'en_route', 'diagnosing', etc).
 */
export const updateRepairStatus = (
    repairId: string,
    payload: UpdateStatusPayload,
): Promise<AxiosResponse<RepairActionResponse>> =>
    apiClient.patch<RepairActionResponse>(`repairs/${repairId}/status`, payload);

/**
 * Submit an estimate for a repair after diagnosing.
 */
export const provideEstimate = (
    repairId: string,
    payload: ProvideEstimatePayload,
): Promise<AxiosResponse<RepairActionResponse>> =>
    apiClient.patch<RepairActionResponse>(`repairs/${repairId}/estimate`, payload);

/**
 * Fetch all repairs that have been assigned to (accepted by) a specific partner.
 * Displayed on the 'My Jobs' tab.
 * @param partnerId - The ID of the logged-in partner.
 * @returns Axios response containing a {@link RepairListResponse}.
 */
export const getPartnerJobs = (
    partnerId: string,
): Promise<AxiosResponse<RepairListResponse>> =>
    apiClient.get<RepairListResponse>('repairs/my-jobs', {
        params: { partner_id: partnerId },
    });

/**
 * Mark a repair job as complete.
 * Only the assigned partner should call this endpoint.
 * @param repairId - The ID of the repair to mark complete.
 * @returns Axios response containing a {@link RepairActionResponse}.
 */
export const completeRepair = (
    repairId: string,
): Promise<AxiosResponse<RepairActionResponse>> =>
    apiClient.patch<RepairActionResponse>(`repairs/${repairId}/complete`);


