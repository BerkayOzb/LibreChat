import React, { useMemo, useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';
import { cn } from '~/utils';
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

  const [transientState, setTransientState] = useRecoilState(store.transientAgentState);

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
      // Save current state if we are not already in agent mode
      if (conversation?.endpoint && conversation.endpoint !== EModelEndpoint.agents) {
        setTransientState({
          isActive: true,
          previousEndpoint: conversation.endpoint,
          previousModel: conversation.model ?? '',
          previousModelSpec: conversation.spec ?? '',
          conversationId: conversation.conversationId,
        });
      } else if (!transientState.isActive) {
        // If we are already in agent mode but state is not active (e.g. page refresh),
        // we might want to set it active or just leave it.
        // For now, let's assume if user explicitly selects an agent, they might want transient mode.
        // But if they are already in agent mode, maybe they are just switching agents.
        // Let's keep the previous state if it exists.
      }

      onSelectEndpoint(EModelEndpoint.agents, {
        agent_id: agentId,
        model: agent.model ?? '',
      });
    }
  };

  const handleClearAgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetEndpoint = transientState.previousEndpoint === EModelEndpoint.agents
      ? EModelEndpoint.openAI
      : (transientState.previousEndpoint || EModelEndpoint.openAI);

    const targetModel = transientState.previousModel || 'gpt-4o';

    newConversation({
      template: {
        conversationId: conversation?.conversationId || transientState.conversationId,
        endpoint: targetEndpoint,
        model: targetModel,
        spec: transientState.previousModelSpec,
      },
      preset: undefined,
      buildDefault: true,
      keepLatestMessage: true,
    });

    setTransientState((prev) => ({ ...prev, isActive: false }));
  };

  const selectedAgentData = useMemo(() => {
    if (!selectedAgent || !agentsMap) {
      return null;
    }
    return agentsMap[selectedAgent];
  }, [selectedAgent, agentsMap]);

  const trigger = (
    <div className={cn("flex items-center", selectedAgent && "gap-2")}>
      <button
        className={cn(
          'flex h-10 items-center justify-center gap-2 rounded-xl border transition-all duration-200',
          selectedAgent
            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 px-3'
            : 'border-border-light bg-surface-secondary hover:bg-surface-tertiary w-10 px-0'
        )}
        aria-label={localize('com_ui_agents')}
        title={selectedAgentData?.name || localize('com_ui_agents')}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'shrink-0',
            selectedAgent ? 'text-blue-600 dark:text-blue-400' : 'text-text-primary'
          )}
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
        {selectedAgent && selectedAgentData && (
          <span className="max-w-[100px] truncate text-xs font-medium text-blue-700 dark:text-blue-300">
            {selectedAgentData.name}
          </span>
        )}
      </button>

      {selectedAgent && (
        <button
          onClick={handleClearAgent}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light bg-surface-secondary text-text-secondary hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
          title={localize('com_ui_clear_agent') || 'Clear Agent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );

  if (!agents || agents.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex">
      <Menu
        className="border-none p-0 w-auto bg-transparent hover:bg-transparent shadow-none min-w-0"
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
