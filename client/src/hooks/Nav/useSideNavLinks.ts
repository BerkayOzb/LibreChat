import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks, MCPIcon, AttachmentIcon } from '@librechat/client';
import {
  Database,
  Bookmark,
  SlidersHorizontal,
  PanelLeftClose,
  Library,
  ShieldCheck,
  Bot,
  FileText,
  Brain,
  Settings,
} from 'lucide-react';
import {
  Permissions,
  EModelEndpoint,
  PermissionTypes,
  SystemRoles,
  isParamEndpoint,
  isAgentsEndpoint,
  isAssistantsEndpoint,
} from 'librechat-data-provider';
import type { TInterfaceConfig, TEndpointsConfig } from 'librechat-data-provider';
import type { NavLink } from '~/common';
import AgentPanelSwitch from '~/components/SidePanel/Agents/AgentPanelSwitch';
import BookmarkPanel from '~/components/SidePanel/Bookmarks/BookmarkPanel';
import MemoryViewer from '~/components/SidePanel/Memories/MemoryViewer';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import PromptsAccordion from '~/components/Prompts/PromptsAccordion';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import FilesPanel from '~/components/SidePanel/Files/Panel';
import MCPPanel from '~/components/SidePanel/MCP/MCPPanel';
import AdminPanelLink from '~/components/SidePanel/Admin/AdminPanelLink';
import { useGetStartupConfig } from '~/data-provider';
import { useHasAccess, useAuthContext } from '~/hooks';

export default function useSideNavLinks({
  hidePanel,
  keyProvided,
  endpoint,
  endpointType,
  interfaceConfig,
  endpointsConfig,
}: {
  hidePanel: () => void;
  keyProvided: boolean;
  endpoint?: EModelEndpoint | null;
  endpointType?: EModelEndpoint | null;
  interfaceConfig: Partial<TInterfaceConfig>;
  endpointsConfig: TEndpointsConfig;
}) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const hasAccessToPrompts = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });
  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });
  const hasAccessToMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.USE,
  });
  const hasAccessToReadMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.READ,
  });
  const hasAccessToAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });
  const hasAccessToCreateAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.CREATE,
  });
  const { data: startupConfig } = useGetStartupConfig();

  const Links = useMemo(() => {
    const links: NavLink[] = [];
    if (
      isAssistantsEndpoint(endpoint) &&
      ((endpoint === EModelEndpoint.assistants &&
        endpointsConfig?.[EModelEndpoint.assistants] &&
        endpointsConfig[EModelEndpoint.assistants].disableBuilder !== true) ||
        (endpoint === EModelEndpoint.azureAssistants &&
          endpointsConfig?.[EModelEndpoint.azureAssistants] &&
          endpointsConfig[EModelEndpoint.azureAssistants].disableBuilder !== true)) &&
      keyProvided
    ) {
      links.push({
        title: 'com_sidepanel_assistant_builder',
        tooltip: 'com_sidepanel_assistant_builder_tooltip',
        label: '',
        icon: Bot,
        id: EModelEndpoint.assistants,
        Component: PanelSwitch,
      });
    }

    if (
      endpointsConfig?.[EModelEndpoint.agents] &&
      hasAccessToAgents &&
      hasAccessToCreateAgents &&
      endpointsConfig[EModelEndpoint.agents].disableBuilder !== true
    ) {
      links.push({
        title: 'com_sidepanel_agent_builder',
        tooltip: 'com_sidepanel_agent_builder_tooltip',
        label: '',
        icon: Bot,
        id: EModelEndpoint.agents,
        Component: AgentPanelSwitch,
      });
    }

    if (hasAccessToPrompts) {
      links.push({
        title: 'com_ui_prompts',
        tooltip: 'com_ui_prompts_tooltip',
        label: '',
        icon: Library,
        id: 'prompts',
        Component: PromptsAccordion,
      });
    }

    if (hasAccessToMemories && hasAccessToReadMemories) {
      links.push({
        title: 'com_ui_memories',
        tooltip: 'com_ui_memories_tooltip',
        label: '',
        icon: Brain,
        id: 'memories',
        Component: MemoryViewer,
      });
    }

    if (
      interfaceConfig.parameters === true &&
      isParamEndpoint(endpoint ?? '', endpointType ?? '') === true &&
      !isAgentsEndpoint(endpoint) &&
      keyProvided
    ) {
      links.push({
        title: 'com_sidepanel_parameters',
        tooltip: 'com_sidepanel_parameters_tooltip',
        label: '',
        icon: SlidersHorizontal,
        id: 'parameters',
        Component: Parameters,
      });
    }

    links.push({
      title: 'com_sidepanel_attach_files',
      tooltip: 'com_sidepanel_attach_files_tooltip',
      label: '',
      icon: FileText,
      id: 'files',
      Component: FilesPanel,
    });

    if (hasAccessToBookmarks) {
      links.push({
        title: 'com_sidepanel_conversation_tags',
        tooltip: 'com_sidepanel_conversation_tags_tooltip',
        label: '',
        icon: Bookmark,
        id: 'bookmarks',
        Component: BookmarkPanel,
      });
    }

    if (user?.role === SystemRoles.ADMIN) {
      links.push({
        title: 'com_sidepanel_admin_panel',
        tooltip: 'com_sidepanel_admin_panel_tooltip',
        label: '',
        icon: Settings,
        id: 'admin-panel',
        onClick: () => navigate('/d/admin'),
      });
    }

    if (
      startupConfig?.mcpServers &&
      Object.values(startupConfig.mcpServers).some(
        (server: any) =>
          (server.customUserVars && Object.keys(server.customUserVars).length > 0) ||
          server.isOAuth ||
          server.startup === false,
      )
    ) {
      links.push({
        title: 'com_nav_setting_mcp',
        tooltip: 'com_nav_setting_mcp_tooltip',
        label: '',
        icon: MCPIcon,
        id: 'mcp-settings',
        Component: MCPPanel,
      });
    }

    links.push({
      title: 'com_sidepanel_hide_panel',
      tooltip: 'com_sidepanel_hide_panel_tooltip',
      label: '',
      icon: PanelLeftClose,
      onClick: hidePanel,
      id: 'hide-panel',
    });

    return links;
  }, [
    endpointsConfig,
    interfaceConfig.parameters,
    keyProvided,
    endpointType,
    endpoint,
    hasAccessToAgents,
    hasAccessToPrompts,
    hasAccessToMemories,
    hasAccessToReadMemories,
    hasAccessToBookmarks,
    hasAccessToCreateAgents,
    hidePanel,
    startupConfig,
    user?.role,
    navigate,
  ]);

  return Links;
}
