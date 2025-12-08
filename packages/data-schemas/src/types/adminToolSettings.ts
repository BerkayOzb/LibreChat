import type { Document, ObjectId } from 'mongoose';

/**
 * Tool identifier enum matching the tools in the UI
 */
export enum ToolIdentifier {
  WEB_SEARCH = 'web_search',
  FILE_SEARCH = 'file_search',
  IMAGE_GENERATION = 'image_generation',
  CODE_INTERPRETER = 'code_interpreter',
  ARTIFACTS = 'artifacts',
  MCP_SERVERS = 'mcp_servers',
}

/**
 * Tool display names for the UI
 */
export const ToolDisplayNames: Record<ToolIdentifier, string> = {
  [ToolIdentifier.WEB_SEARCH]: 'Web Search',
  [ToolIdentifier.FILE_SEARCH]: 'File Search',
  [ToolIdentifier.IMAGE_GENERATION]: 'Image Generation',
  [ToolIdentifier.CODE_INTERPRETER]: 'Code Interpreter',
  [ToolIdentifier.ARTIFACTS]: 'Artifacts',
  [ToolIdentifier.MCP_SERVERS]: 'MCP Servers',
};

/**
 * Tool icons for the UI (lucide-react icon names)
 */
export const ToolIcons: Record<ToolIdentifier, string> = {
  [ToolIdentifier.WEB_SEARCH]: 'Globe',
  [ToolIdentifier.FILE_SEARCH]: 'Search',
  [ToolIdentifier.IMAGE_GENERATION]: 'Image',
  [ToolIdentifier.CODE_INTERPRETER]: 'Terminal',
  [ToolIdentifier.ARTIFACTS]: 'Code',
  [ToolIdentifier.MCP_SERVERS]: 'Server',
};

/**
 * MongoDB Document interface for admin tool settings
 */
export interface IAdminToolSettings extends Document {
  _id: ObjectId;
  toolId: string;
  enabled: boolean;
  allowedRoles: string[];
  order: number;
  description?: string;
  metadata?: Record<string, unknown>;
  disabledBy?: ObjectId;
  disabledAt?: Date;
  reason?: string;
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plain object type for admin tool settings (API responses)
 */
export interface TAdminToolSettings {
  _id?: string;
  toolId: string;
  enabled: boolean;
  allowedRoles: string[];
  order: number;
  description?: string;
  metadata?: Record<string, unknown>;
  disabledBy?: string;
  disabledAt?: string;
  reason?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request type for updating tool settings
 */
export interface TAdminToolSettingsUpdate {
  enabled?: boolean;
  allowedRoles?: string[];
  order?: number;
  description?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

/**
 * Request type for creating tool settings
 */
export interface TAdminToolSettingsCreate {
  toolId: string;
  enabled?: boolean;
  allowedRoles?: string[];
  order?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request type for toggling tool status
 */
export interface TToolToggleRequest {
  toolId: string;
  enabled: boolean;
  reason?: string;
}

/**
 * Request type for bulk tool updates
 */
export interface TToolBulkUpdate {
  updates: Array<{
    toolId: string;
    enabled?: boolean;
    order?: number;
  }>;
}

/**
 * Response type for tool settings API
 */
export interface TToolSettingsResponse {
  settings: TAdminToolSettings[];
  stats: {
    total: number;
    enabled: number;
    disabled: number;
  };
}

/**
 * Default tool configurations
 */
export const DefaultToolConfigs: Array<{
  toolId: ToolIdentifier;
  enabled: boolean;
  order: number;
  description: string;
}> = [
  {
    toolId: ToolIdentifier.WEB_SEARCH,
    enabled: true,
    order: 0,
    description: 'Search the web for real-time information',
  },
  {
    toolId: ToolIdentifier.FILE_SEARCH,
    enabled: true,
    order: 1,
    description: 'Search through uploaded files and documents',
  },
  {
    toolId: ToolIdentifier.IMAGE_GENERATION,
    enabled: true,
    order: 2,
    description: 'Generate images using AI models',
  },
  {
    toolId: ToolIdentifier.CODE_INTERPRETER,
    enabled: true,
    order: 3,
    description: 'Execute code and analyze data',
  },
  {
    toolId: ToolIdentifier.ARTIFACTS,
    enabled: true,
    order: 4,
    description: 'Display code output and visual artifacts',
  },
  {
    toolId: ToolIdentifier.MCP_SERVERS,
    enabled: true,
    order: 5,
    description: 'Connect to Model Context Protocol servers',
  },
];
