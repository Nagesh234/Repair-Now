/**
 * @file repairApi.ts
 * @description Repair request API calls for the Repair Now Client app.
 *
 * Covers: creating a new repair request and fetching the client's repairs.
 */

import apiClient from './client';
import {
    CreateRepairPayload,
    RepairListResponse,
    RepairResponse,
    CategoryListResponse,
    RateRepairPayload,
} from '../types/models';
import { AxiosResponse } from 'axios';

/**
 * Fetch all master data repair categories.
 * @returns Axios response containing a {@link CategoryListResponse}.
 */
export const getCategories = (): Promise<AxiosResponse<CategoryListResponse>> =>
    apiClient.get<CategoryListResponse>('categories');

/**
 * Submit a new repair request on behalf of the logged-in client.
 * @param payload - All required fields for a new repair request.
 * @returns Axios response containing a {@link RepairResponse}.
 */
export const createRepair = (
    payload: CreateRepairPayload,
): Promise<AxiosResponse<RepairResponse>> =>
    apiClient.post<RepairResponse>('repairs', payload);

/**
 * Fetch all repair requests submitted by a specific client.
 * @param clientId - The ID of the logged-in client user.
 * @returns Axios response containing a {@link RepairListResponse}.
 */
export const getClientRepairs = (
    clientId: string,
): Promise<AxiosResponse<RepairListResponse>> =>
    apiClient.get<RepairListResponse>('repairs', {
        params: { client_id: clientId },
    });

/**
 * Approve an estimate for a specific repair.
 * Changes the status from 'estimate_provided' to 'repairing'.
 * @param repairId - The ID of the repair.
 * @returns Axios response containing a {@link RepairResponse}.
 */
export const approveEstimate = (
    repairId: string,
): Promise<AxiosResponse<RepairResponse>> =>
    apiClient.patch<RepairResponse>(`repairs/${repairId}/approve-estimate`);


/**
 * Submit a 1-5 star rating for a completed repair.
 * @param repairId - The ID of the completed repair.
 * @param payload - Contains the rating value (1-5).
 */
export const rateRepair = (
    repairId: string,
    payload: RateRepairPayload,
): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`repairs/${repairId}/rate`, payload);

