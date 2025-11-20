import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useWatch } from 'react-hook-form';
import { EModelEndpoint } from 'librechat-data-provider';
import { useNewConvo } from '~/hooks';
import { useAssistantsMapContext, useChatContext, useChatFormContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import useSelectMention from '~/hooks/Input/useSelectMention';
import store from '~/store';
import { cn } from '~/utils';

export default function TransientNotification({ index = 0 }: { index?: number }) {
    const { newConversation } = useNewConvo(index);
    const { conversation } = useChatContext();
    const methods = useChatFormContext();
    const text = useWatch({ control: methods.control, name: 'text' });

    const [transientState, setTransientState] = useRecoilState(store.transientAgentState);
    const isSubmitting = useRecoilValue(store.isSubmittingFamily(index));

    const assistantsMap = useAssistantsMapContext();
    const { data: startupConfig } = useGetStartupConfig();
    const { data: endpointsConfig } = useGetEndpointsQuery();

    const { onSelectEndpoint } = useSelectMention({
        modelSpecs: startupConfig?.modelSpecs?.list ?? [],
        assistantsMap,
        endpointsConfig: endpointsConfig ?? {},
        newConversation,
        returnHandlers: true,
    });

    const [isVisible, setIsVisible] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const prevSubmittingRef = useRef(isSubmitting);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const DURATION = 30000; // 30 seconds

    const handleSwitchBack = () => {
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
        setTransientState(prev => ({ ...prev, isActive: false }));
        setIsVisible(false);
    };

    const handleCancel = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Do NOT set isActive: false, so it triggers again on next response
        setIsVisible(false);
    };

    // Auto-cancel on typing
    useEffect(() => {
        if (isVisible && text && text.length > 0) {
            handleCancel();
        }
    }, [text, isVisible]);

    useEffect(() => {
        if (transientState.isActive && prevSubmittingRef.current && !isSubmitting) {
            setIsVisible(true);
            setCountdown(30);

            intervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            timeoutRef.current = setTimeout(() => {
                handleSwitchBack();
            }, DURATION);
        } else if (!transientState.isActive) {
            setIsVisible(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        prevSubmittingRef.current = isSubmitting;

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSubmitting, transientState.isActive]);

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-full left-1/2 z-50 -translate-x-1/2 transform mb-2 w-auto whitespace-nowrap">
            <div className="flex items-center gap-4 rounded-lg border border-border-light bg-surface-primary p-3 shadow-xl dark:border-border-medium dark:bg-surface-secondary">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-medium text-text-primary">
                        Agent yanıtladı
                    </h3>
                    <p className="text-[10px] text-text-secondary">
                        {countdown} sn içinde dönülüyor...
                    </p>
                </div>
                <div className="flex gap-2 ml-2">
                    <button
                        onClick={handleCancel}
                        className="rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSwitchBack}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        Şimdi Dön
                    </button>
                </div>
            </div>
        </div>
    );
}
