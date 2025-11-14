import type { Document, ObjectId } from 'mongoose';

export interface IProviderSettings extends Document {
  _id: ObjectId;
  endpoint: string;
  providerDisplayOrder: string[];
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TProviderSettings {
  _id?: string;
  endpoint: string;
  providerDisplayOrder: string[];
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TProviderSettingsUpdate {
  providerDisplayOrder: string[];
}

export interface TProviderSettingsResponse {
  _id: string;
  endpoint: string;
  providerDisplayOrder: string[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
