import type { Client, IAgentRuntime } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import { TerminalClient } from './terminalClient';

export const TerminalClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        // System initialization message - use debug level
        elizaLogger.debug("Terminal client initializing...");
        const client = new TerminalClient(runtime);
        await client.start();
        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        // System cleanup message - use debug level
        elizaLogger.debug("Terminal client cleanup...");
        // Cleanup will be handled by TerminalClient instance
    }
};

export default TerminalClientInterface;
export * from './terminalClient';
export * from './types';
export * from './messageManager'; 