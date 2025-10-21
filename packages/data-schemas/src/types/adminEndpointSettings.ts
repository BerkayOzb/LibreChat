import type { Document, ObjectId } from 'mongoose';

export interface IAdminEndpointSettings extends Document {
  _id: ObjectId;
  endpoint: string;
  enabled: boolean;
  allowedRoles: string[];
  order: number;
  description?: string;
  metadata?: Record<string, any>;
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TAdminEndpointSettings {
  _id?: string;
  endpoint: string;
  enabled: boolean;
  allowedRoles: string[];
  order: number;
  description?: string;
  metadata?: Record<string, any>;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TAdminEndpointSettingsUpdate {
  endpoint?: string;
  enabled?: boolean;
  allowedRoles?: string[];
  order?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TAdminEndpointSettingsCreate {
  endpoint: string;
  enabled?: boolean;
  allowedRoles?: string[];
  order?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TEndpointToggleRequest {
  endpoint: string;
  enabled: boolean;
}

export interface TEndpointOrderUpdate {
  endpoint: string;
  order: number;
}

export interface TEndpointBulkUpdate {
  updates: TEndpointOrderUpdate[];
}

export interface TEndpointStatusFilter {
  enabled?: boolean;
  allowedRoles?: string[];
}

export interface TEndpointSettingsResponse {
  settings: TAdminEndpointSettings[];
  total: number;
  enabled: number;
  disabled: number;
}