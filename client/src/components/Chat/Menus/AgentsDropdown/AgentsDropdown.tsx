import React, { useMemo, useState, useEffect } from 'react';
import { useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useListAgentsQuery, useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import { useAgentDefaultPermissionLevel, useNewConvo } from '~/hooks';
import { useLocalize } from '~/hooks';
import { CustomMenu as Menu } from '../Endpoints/CustomMenu';
import { AgentMenuItem } from './components/AgentMenuItem';
import { EModelEndpoint } from 'librechat-data-provider';
import useSelectMention from '~/hooks/Input/useSelectMention';
import { useChatContext } from '~/Providers';

export default function AgentsDropdown() {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantsMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const permissionLevel = useAgentDefaultPermissionLevel();
  const { newConversation } = useNewConvo();

  const { data: agents = [] } = useListAgentsQuery(
    { requiredPermission: permissionLevel },
    {
      select: (data) => data?.data ?? [],
    },
  );

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');

  // Mevcut konuşmadan agent'ı al
  useEffect(() => {
    if (conversation?.endpoint === EModelEndpoint.agents && conversation?.agent_id) {
      setSelectedAgent(conversation.agent_id);
    } else {
      setSelectedAgent('');
    }
  }, [conversation?.endpoint, conversation?.agent_id]);

  const { onSelectEndpoint } = useSelectMention({
    modelSpecs: startupConfig?.modelSpecs?.list ?? [],
    assistantsMap,
    endpointsConfig: endpointsConfig ?? {},
    newConversation,
    returnHandlers: true,
  });

  const filteredAgents = useMemo(() => {
    if (!searchValue) {
      return agents;
    }
    const searchLower = searchValue.toLowerCase();
    return agents.filter((agent) =>
      agent.name?.toLowerCase().includes(searchLower) ||
      agent.description?.toLowerCase().includes(searchLower)
    );
  }, [agents, searchValue]);

  const handleSelectAgent = (agentId: string) => {
    const agent = agentsMap?.[agentId];
    if (agent && onSelectEndpoint) {
      onSelectEndpoint(EModelEndpoint.agents, {
        agent_id: agentId,
        model: agent.model ?? '',
      });
    }
  };

  const selectedAgentData = useMemo(() => {
    if (!selectedAgent || !agentsMap) {
      return null;
    }
    return agentsMap[selectedAgent];
  }, [selectedAgent, agentsMap]);

  const trigger = (
    <button
      className="my-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border-light bg-surface-secondary text-text-primary hover:bg-surface-tertiary"
      aria-label={localize('com_ui_agents')}
      title={selectedAgentData?.name || localize('com_ui_agents')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-text-primary shrink-0"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  if (!agents || agents.length === 0) {
    return null;
  }

  return (
    <div className="relative flex flex-col items-center gap-2">
      <Menu
        values={{ agent: selectedAgent }}
        onValuesChange={(values: Record<string, any>) => {
          if (values.agent) {
            handleSelectAgent(values.agent);
          }
        }}
        onSearch={setSearchValue}
        combobox={<input placeholder={localize('com_agents_search_placeholder')} />}
        trigger={trigger}
      >
        <div className="flex flex-col">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <AgentMenuItem
                key={agent.id}
                agent={agent}
                selected={selectedAgent === agent.id}
                onSelect={() => handleSelectAgent(agent.id)}
              />
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-text-secondary">
              {localize('com_ui_no_results_found')}
            </div>
          )}
        </div>
      </Menu>
    </div>
  );
}
