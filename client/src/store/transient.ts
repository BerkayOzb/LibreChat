import { atom } from 'recoil';

export interface TransientState {
    isActive: boolean;
    previousEndpoint: string;
    previousModel: string;
    previousModelSpec?: string;
    conversationId?: string;
    agentId?: string;
}

export const transientAgentState = atom<TransientState>({
    key: 'transientAgentState',
    default: {
        isActive: false,
        previousEndpoint: '',
        previousModel: '',
        conversationId: '',
    },
});

export default { transientAgentState };
