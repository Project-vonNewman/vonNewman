import * as readline from 'readline';
import type { IAgentRuntime } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import { MessageManager } from './messageManager';

export class TerminalClient {
    private messageManager: MessageManager;
    private rl: readline.Interface;
    private isRunning: boolean = false;

    constructor(private runtime: IAgentRuntime) {
        this.messageManager = new MessageManager(runtime);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    public async start(): Promise<void> {
        this.isRunning = true;
        elizaLogger.info("\n=== Terminal Chat Started ===");
        elizaLogger.info(`Chatting with: ${this.runtime.character.name}`);
        elizaLogger.info("Type 'exit' to quit\n");

        this.setupInputHandler();
        this.setupShutdownHandler();
    }

    public async handleMessage(message: string): Promise<void> {
        await this.messageManager.handleMessage(message);
    }

    private setupInputHandler(): void {
        this.rl.on('line', async (input: string) => {
            if (!this.isRunning) return;

            if (input.toLowerCase() === 'exit') {
                await this.stop();
                return;
            }

            await this.handleMessage(input);
        });
    }

    private setupShutdownHandler(): void {
        const handler = async (signal: string) => {
            elizaLogger.log(`Received ${signal}. Shutting down...`);
            await this.stop();
        };

        process.once('SIGINT', () => handler('SIGINT'));
        process.once('SIGTERM', () => handler('SIGTERM'));
    }

    public async stop(): Promise<void> {
        this.isRunning = false;
        this.rl.close();
    }
}

// Export a function to handle single messages
export async function handleSingleMessage(runtime: IAgentRuntime, message: string): Promise<void> {
    const client = new TerminalClient(runtime);
    await client.handleMessage(message);
} 