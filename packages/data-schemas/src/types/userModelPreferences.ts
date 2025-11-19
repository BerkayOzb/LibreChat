import type { Document, Types } from 'mongoose';

export interface IPinnedModel {
  endpoint: string;
  provider: string;
  modelName: string;
  pinnedAt: Date;
}

export interface IUserModelPreferences extends Document {
  userId: Types.ObjectId;
  pinnedModels: IPinnedModel[];
  createdAt: Date;
  updatedAt: Date;
}

export type TGetPinnedModelsResponse = {
  userId: string;
  pinnedModels: string[]; // Array of model names for specific endpoint+provider
};
