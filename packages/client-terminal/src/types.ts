import type { Content, Memory } from '@elizaos/core';

export interface Command {
    name: string;
    description: string;
    execute: (args: string[]) => Promise<void>;
}

export interface MessageHandler {
    handleMessage: (input: string) => Promise<void>;
}

export interface MessageResponse {
    content: Content;
    memory: Memory;
}