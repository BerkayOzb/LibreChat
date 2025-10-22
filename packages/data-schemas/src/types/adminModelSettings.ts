import type { Document, ObjectId } from 'mongoose';

export interface IAdminModelSettings extends Document {
  _id: ObjectId;
  endpoint: string;
  modelName: string;
  isEnabled: boolean;
  disabledBy?: ObjectId;
  disabledAt?: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TAdminModelSettings {
  _id?: string;
  endpoint: string;
  modelName: string;
  isEnabled: boolean;
  disabledBy?: string;
  disabledAt?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TAdminModelSettingsUpdate {
  isEnabled?: boolean;
  reason?: string;
}

export interface TAdminModelSettingsCreate {
  endpoint: string;
  modelName: string;
  isEnabled: boolean;
  reason?: string;
}

export interface TAdminModelSettingsToggleRequest {
  endpoint: string;
  modelName: string;
  isEnabled: boolean;
  reason?: string;
}

export interface TAdminModelSettingsResponse {
  _id: string;
  endpoint: string;
  modelName: string;
  isEnabled: boolean;
  disabledBy?: string;
  disabledAt?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TAdminModelSettingsBulkUpdate {
  endpoint: string;
  updates: Array<{
    modelName: string;
    isEnabled: boolean;
    reason?: string;
  }>;
}

export interface TAdminModelSettingsFilter {
  endpoint?: string;
  isEnabled?: boolean;
  modelName?: string;
}

// For endpoint model overview
export interface TEndpointModelsOverview {
  endpoint: string;
  totalModels: number;
  enabledModels: number;
  disabledModels: number;
  models: TAdminModelSettingsResponse[];
}

// For admin dashboard stats
export interface TAdminModelControlStats {
  totalEndpoints: number;
  totalModels: number;
  totalEnabled: number;
  totalDisabled: number;
  endpointStats: Array<{
    endpoint: string;
    totalModels: number;
    enabledModels: number;
    disabledModels: number;
  }>;
}

// For frontend model list with availability status
export interface TModelWithAdminStatus {
  modelName: string;
  isEnabled: boolean;
  reason?: string;
  disabledBy?: string;
  disabledAt?: string;
}

// For bulk operations response
export interface TAdminModelSettingsBulkResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors?: Array<{
    modelName: string;
    error: string;
  }>;
}