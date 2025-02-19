import type { IAgentRuntime, Memory, Content, Action } from '@elizaos/core';
import { elizaLogger, stringToUuid, composeContext, generateMessageResponse, ModelClass } from '@elizaos/core';
import type { MessageHandler, MessageResponse } from './types';
import { messageHandlerTemplate } from './templates';

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m"
};

export class MessageManager implements MessageHandler {
    constructor(private runtime: IAgentRuntime) {}

    async handleMessage(input: string): Promise<void> {
        try {
            // Skip empty messages
            if (!input || input.trim().length === 0) {
                return;
            }

            // Echo user input with yellow color
            process.stdout.write(`\n${colors.yellow}You: ${colors.reset}${input}\n\n`);

            // Check if input is an action command
            const actionMatch = input.match(/^([A-Z_]+)\s+(.+)$/);
            if (actionMatch) {
                const [_, actionName, actionInput] = actionMatch;
                await this.executeAction(actionName, actionInput);
                return;
            }

            const memory = await this.createMemory(input);
            const response = await this.generateResponse(memory) as MessageResponse;
            if (response?.content) {
                await this.handleResponse(response);
            }
        } catch (error) {
            elizaLogger.error('Error handling message:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error && error.stack) {
                elizaLogger.debug('Error stack:', error.stack);
            }
            elizaLogger.error('An error occurred while processing your message.');
        }
    }

    private async executeAction(actionName: string, input: string): Promise<void> {
        // Find the action
        const action = this.runtime.actions.find(a => a.name === actionName);
        if (!action) {
            elizaLogger.error(`Unknown action: ${actionName}`);
            return;
        }

        try {
            // Create a memory for the action input
            const memory = await this.createMemory(input);

            // Get the current state
            const state = await this.runtime.composeState(memory);

            // Execute the action
            elizaLogger.info(`Executing action ${actionName} with input: ${input}`);
            const result = await action.handler(this.runtime, memory, state);

            // Log the result
            if (result) {
                elizaLogger.info(`\nAction ${actionName} result:`, result);
            }
        } catch (error) {
            elizaLogger.error(`Error executing action ${actionName}:`, error);
            elizaLogger.error(`Failed to execute action ${actionName}`);
        }
    }

    private async createMemory(input: string): Promise<Memory> {
        const userId = stringToUuid("user");
        const roomId = stringToUuid("terminal");

        const memory: Memory = {
            id: stringToUuid(Date.now().toString()),
            content: {
                text: input,
                attachments: [],
                source: "terminal"
            },
            userId,
            roomId,
            agentId: this.runtime.agentId,
            createdAt: Date.now()
        };

        await this.runtime.messageManager.createMemory(memory);
        return memory;
    }

    private async generateResponse(memory: Memory): Promise<MessageResponse> {
        const state = await this.runtime.composeState(
            {
                content: memory.content,
                userId: memory.userId,
                roomId: memory.roomId,
                agentId: memory.agentId
            },
            {
                agentName: this.runtime.character.name
            }
        );

        const context = composeContext({
            state,
            template: messageHandlerTemplate
        });

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE
        });

        if (!response) {
            throw new Error("No response generated");
        }

        const responseMemory: Memory = {
            id: stringToUuid(Date.now().toString()),
            agentId: this.runtime.agentId,
            userId: this.runtime.agentId,
            roomId: memory.roomId,
            content: response,
            createdAt: Date.now()
        };

        await this.runtime.messageManager.createMemory(responseMemory);

        // Log the response text
        if (response && typeof response === 'object' && 'text' in response) {
            process.stdout.write(`${colors.cyan}${this.runtime.character.name}${colors.reset}: ${response.text}\n\n`);
        }

        return {
            content: response,
            memory: responseMemory
        };
    }

    private async handleResponse(response: MessageResponse): Promise<void> {
        // The response has already been logged in generateResponse
        // This method is kept for potential future handling needs
        return;
    }
} 