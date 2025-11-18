import React, { useMemo, useState, useEffect } from 'react';
import { useAssistantsMapContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import { useNewConvo } from '~/hooks';
import { useLocalize } from '~/hooks';
import { CustomMenu as Menu } from '../Endpoints/CustomMenu';
import { AssistantMenuItem } from './components/AssistantMenuItem';
import { EModelEndpoint } from 'librechat-data-provider';
import useSelectMention from '~/hooks/Input/useSelectMention';
import { useChatContext } from '~/Providers';

export default function AssistantsDropdown() {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const assistantsMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { newConversation } = useNewConvo();

  const assistants = useMemo(
    () => Object.values(assistantsMap?.[EModelEndpoint.assistants] ?? {}),
    [assistantsMap],
  );

  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');

  // Get current assistant from conversation
  useEffect(() => {
    if (conversation?.endpoint === EModelEndpoint.assistants && conversation?.assistant_id) {
      setSelectedAssistant(conversation.assistant_id);
    } else {
      setSelectedAssistant('');
    }
  }, [conversation?.endpoint, conversation?.assistant_id]);

  const { onSelectEndpoint } = useSelectMention({
    modelSpecs: startupConfig?.modelSpecs?.list ?? [],
    assistantsMap,
    endpointsConfig: endpointsConfig ?? {},
    newConversation,
    returnHandlers: true,
  });

  const filteredAssistants = useMemo(() => {
    if (!searchValue) {
      return assistants;
    }
    const searchLower = searchValue.toLowerCase();
    return assistants.filter((assistant: any) =>
      assistant.name?.toLowerCase().includes(searchLower) ||
      assistant.description?.toLowerCase().includes(searchLower)
    );
  }, [assistants, searchValue]);

  const handleSelectAssistant = (assistantId: string) => {
    if (onSelectEndpoint) {
      onSelectEndpoint(EModelEndpoint.assistants, {
        assistant_id: assistantId,
        model: '',
      });
    }
  };

  const selectedAssistantData = useMemo(() => {
    if (!selectedAssistant || !assistants) {
      return null;
    }
    return assistants.find((a: any) => a.id === selectedAssistant);
  }, [selectedAssistant, assistants]);

  const trigger = (
    <button
      className="my-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border-light bg-surface-secondary text-text-primary hover:bg-surface-tertiary"
      aria-label={localize('com_ui_assistants')}
      title={selectedAssistantData?.name || localize('com_ui_assistants')}
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
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L12.75 18.75l1.933-.394a2.25 2.25 0 001.423-1.423l.394-1.933.394 1.933a2.25 2.25 0 001.423 1.423l1.933.394-1.933.394a2.25 2.25 0 00-1.423 1.423z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  // Show button even if no assistants available
  // if (!assistants || assistants.length === 0) {
  //   return null;
  // }

  return (
    <div className="relative flex flex-col items-center gap-2">
      <Menu
        values={{ assistant: selectedAssistant }}
        onValuesChange={(values: Record<string, any>) => {
          if (values.assistant) {
            handleSelectAssistant(values.assistant);
          }
        }}
        onSearch={setSearchValue}
        combobox={<input placeholder={localize('com_assistants_search_placeholder')} />}
        trigger={trigger}
      >
        <div className="flex flex-col">
          {filteredAssistants.length > 0 ? (
            filteredAssistants.map((assistant: any) => (
              <AssistantMenuItem
                key={assistant.id}
                assistant={assistant}
                selected={selectedAssistant === assistant.id}
                onSelect={() => handleSelectAssistant(assistant.id)}
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
