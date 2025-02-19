import { Command } from 'commander';
import type { Memory, Content } from '@elizaos/core';
import { processDocumentsAction } from "@vonNewman/plugin-knowledge-manager";
import { checkEnvironment } from './utils.js';
import { initializeAgent } from './start.js';
import { getConfig } from './utils.js';
import { elizaLogger } from '@elizaos/core';

interface AddOptions {
    types: string;
    recursive: boolean;
    config?: string;
}

export async function addCommand(path: string, options: AddOptions) {
    try {
        await checkEnvironment();
        const runtime = await initializeAgent();

        // Call the action handler directly
        const success = await processDocumentsAction.handler(
            runtime,
            {
                content: { text: `Process documents at ${path}` }
            } as Memory,
            undefined,
            {
                configPath: options.config,
                path: path,
                types: options.types.split(','),
                recursive: options.recursive
            },
            async (message: Content) => {
                if (message.error) {
                    elizaLogger.error(message.text);
                } else {
                    elizaLogger.info(message.text);
                }
                return [];
            }
        );

        if (!success) {
            throw new Error("Failed to process documents");
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            elizaLogger.error('Failed to process:', error.message);
        } else {
            elizaLogger.error('An unknown error occurred while processing files');
        }
        process.exit(1);
    }
}

export function registerAddCommand(program: Command) {
    const config = getConfig();
    program
        .command('add <path>')
        .description('Add files or documents to knowledge base')
        .option('-t, --types <types>', 'File types to process (comma-separated)', config.defaultFileTypes.join(','))
        .option('-r, --recursive', 'Process directories recursively', true)
        .option('-c, --config <config>', 'Use a config file for advanced processing options')
        .addHelpText('after', `
Examples:
  # Process files directly:
  $ vonNewman add ./docs -t md,txt
  $ vonNewman add ./src -t js,ts -r
  
  # Process using a config file:
  $ vonNewman add ./docs -c docs-config.json

Config File Format:
  {
    "sources": [{
      "path": "./docs",
      "types": ["md", "txt"],
      "recursive": true
    }],
    "options": {
      "chunkSize": 1000,
      "overlap": 200
    }
  }`)
        .action(addCommand);
} 