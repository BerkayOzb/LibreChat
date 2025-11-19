import type { Document, Types } from 'mongoose';

export interface IModelSettings extends Document {
  endpoint: string;
  provider: string;
  modelDisplayOrder: string[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TModelSettings = {
  endpoint: string;
  provider: string;
  modelDisplayOrder: string[];
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TModelSettingsUpdate = {
  endpoint: string;
  provider: string;
  modelDisplayOrder: string[];
};

export type TModelSettingsResponse = {
  endpoint: string;
  provider: string;
  modelDisplayOrder: string[];
};
