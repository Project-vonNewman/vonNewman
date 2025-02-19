import { Command } from 'commander';
import type { AgentRuntime } from '@elizaos/core';
import { createAgent } from '@vonNewman/core';
import { TerminalClientInterface, handleSingleMessage as terminalHandleSingleMessage } from '@vonNewman/client-terminal';
import { knowledgeManagerPlugin, ragProvider } from "@vonNewman/plugin-knowledge-manager";
import { checkEnvironment } from './utils.js';
import { getConfig } from './utils.js';
import { stringToUuid } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';

export async function initializeAgent(): Promise<AgentRuntime> {
    const config = getConfig();
    try {
        const runtime = await createAgent({
            dbPath: config.paths.dbPath,
            agentId: config.agentId,
            token: process.env.GROQ_API_KEY || '',
            plugins: [knowledgeManagerPlugin] // Register the knowledge manager plugin
        });

        // Manually register the RAG provider, as temp solution
       

        return runtime;
    } catch (error) {
        elizaLogger.error('Failed to initialize agent:', error);
        throw error;
    }
}

export async function startCommand() {
    try {
        await checkEnvironment();
        const runtime = await initializeAgent();

        // Start terminal client
        await TerminalClientInterface.start(runtime);

        // Start Telegram client if configured
        if (process.env.TELEGRAM_BOT_TOKEN) {
            const { TelegramClientInterface } = await import('@elizaos/client-telegram');
            await TelegramClientInterface.start(runtime);
            elizaLogger.info('Telegram client started');
        }

        // Register RAG provider
        if (runtime.ragKnowledgeManager) {
            elizaLogger.info('Registering RAG provider...');
            runtime.registerContextProvider(ragProvider);
            elizaLogger.info('RAG provider registered successfully');
        }

        elizaLogger.info('vonNewman started successfully');
    } catch (error: unknown) {
        if (error instanceof Error) {
            elizaLogger.error('Failed to start vonNewman:', error.message);
            if (error.stack) {
                elizaLogger.error(error.stack);
            }
        } else {
            elizaLogger.error('An unknown error occurred while starting vonNewman:', error);
        }
        process.exit(1);
    }
}

export function registerStartCommand(program: Command) {
    program
        .command('start')
        .description('Start vonNewman in interactive mode')
        .action(startCommand);
}

export async function handleSingleMessage(message: string) {
    try {
        await checkEnvironment();
        const runtime = await initializeAgent();
        
        // Check if this is an action command
        const actionMatch = message.match(/^([A-Z_]+)\s+(.+)$/);
        if (actionMatch) {
            const [, actionName, query] = actionMatch;
            elizaLogger.info(`Executing action: ${actionName}`);
            elizaLogger.info(`Query: ${query}`);
            
            // Find the action
            const action = runtime.actions.find(a => a.name === actionName);
            if (!action) {
                elizaLogger.error(`Unknown action: ${actionName}`);
                process.exit(1);
                return;
            }

            try {
                // Create a memory for the action input
                const memory = {
                    id: stringToUuid(Date.now().toString()),
                    content: {
                        text: query,
                        attachments: [],
                        source: "terminal"
                    },
                    userId: stringToUuid("user"),
                    roomId: stringToUuid("terminal"),
                    agentId: runtime.agentId,
                    createdAt: Date.now()
                };

                // Get the current state
                const state = await runtime.composeState(memory);

                // Execute the action
                const result = await action.handler(runtime, memory, state, {
                    matchCount: 5,
                    matchThreshold: 0.75
                });

                // Log the result
                if (result) {
                    elizaLogger.info('\nAction result:', result);
                }
            } catch (error) {
                elizaLogger.error(`Error executing action ${actionName}:`, error);
                process.exit(1);
                return;
            }
            
            process.exit(0);
            return;
        }
        
        // Handle regular message
        await terminalHandleSingleMessage(runtime, message);
        
        // Exit after handling the message
        process.exit(0);
    } catch (error: unknown) {
        if (error instanceof Error) {
            elizaLogger.error('Failed to process message:', error.message);
            if (error.stack) {
                elizaLogger.error(error.stack);
            }
        } else {
            elizaLogger.error('An unknown error occurred while processing message:', error);
        }
        process.exit(1);
    }
} 