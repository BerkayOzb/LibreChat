import type { Document, ObjectId } from 'mongoose';

export interface IAdminApiKey extends Document {
  _id: ObjectId;
  endpoint: string;
  apiKey: string; // Encrypted API key
  baseURL?: string;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdBy: ObjectId;
  updatedBy?: ObjectId;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TAdminApiKey {
  _id?: string;
  endpoint: string;
  apiKey: string; // For API responses, we may want to mask this
  baseURL?: string;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  lastUsed?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TAdminApiKeyUpdate {
  apiKey?: string;
  baseURL?: string;
  isActive?: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TAdminApiKeyCreate {
  endpoint: string;
  apiKey: string;
  baseURL?: string;
  isActive?: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TAdminApiKeyToggleRequest {
  endpoint: string;
  isActive: boolean;
}

export interface TAdminApiKeyResponse {
  _id: string;
  endpoint: string;
  apiKey: string; // Masked key for security (e.g., "sk-****...****abcd")
  baseURL?: string;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TAdminApiKeysResponse {
  keys: TAdminApiKeyResponse[];
  total: number;
  active: number;
  inactive: number;
}

export interface TAdminApiKeyFilter {
  isActive?: boolean;
  endpoint?: string;
}

// For frontend forms
export interface TAdminApiKeyFormData {
  endpoint: string;
  apiKey: string;
  baseURL?: string;
  description?: string;
  isActive: boolean;
}

// Azure-specific metadata interface
export interface TAzureApiKeyMetadata {
  azureOpenAIApiKey?: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiDeploymentName?: string;
  azureOpenAIApiVersion?: string;
}

// For different endpoint types that may have special requirements
export interface TEndpointApiKeyConfig {
  endpoint: string;
  requiresBaseURL: boolean;
  supportsCustomModels: boolean;
  isAzureType: boolean;
  displayName: string;
  description?: string;
}