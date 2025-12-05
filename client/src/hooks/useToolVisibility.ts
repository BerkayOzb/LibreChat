import { useQuery } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';
import { dataService, QueryKeys } from 'librechat-data-provider';
import store from '~/store';

// Tool visibility types (mirrors backend response)
export interface TToolVisibilityItem {
  enabled: boolean;
  visible: boolean;
  allowedRoles: string[];
}

export interface TToolVisibilityResponse {
  visibility: Record<string, TToolVisibilityItem>;
  userRole: string;
}

// Tool ID constants for type safety
export const ToolIds = {
  WEB_SEARCH: 'web_search',
  FILE_SEARCH: 'file_search',
  IMAGE_GENERATION: 'image_generation',
  CODE_INTERPRETER: 'code_interpreter',
  ARTIFACTS: 'artifacts',
  MCP_SERVERS: 'mcp_servers',
} as const;

export type ToolId = (typeof ToolIds)[keyof typeof ToolIds];

/**
 * Hook to get tool visibility settings for the current user
 * Returns which tools are visible/enabled based on admin settings and user role
 */
export const useToolVisibility = () => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);

  const query = useQuery<TToolVisibilityResponse>(
    [QueryKeys.toolVisibility],
    () => dataService.getToolVisibility(),
    {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      enabled: queriesEnabled,
    },
  );

  /**
   * Check if a specific tool is visible for the current user
   * @param toolId - The tool identifier
   * @returns boolean - whether the tool should be visible
   */
  const isToolVisible = (toolId: ToolId | string): boolean => {
    if (!query.data?.visibility) {
      // Default to true if data hasn't loaded yet to prevent flash
      return true;
    }
    const toolVisibility = query.data.visibility[toolId];
    return toolVisibility?.visible ?? true;
  };

  /**
   * Check if a specific tool is enabled (by admin)
   * @param toolId - The tool identifier
   * @returns boolean - whether the tool is enabled
   */
  const isToolEnabled = (toolId: ToolId | string): boolean => {
    if (!query.data?.visibility) {
      return true;
    }
    const toolVisibility = query.data.visibility[toolId];
    return toolVisibility?.enabled ?? true;
  };

  return {
    ...query,
    isToolVisible,
    isToolEnabled,
    visibility: query.data?.visibility ?? {},
    userRole: query.data?.userRole ?? 'USER',
  };
};

export default useToolVisibility;
