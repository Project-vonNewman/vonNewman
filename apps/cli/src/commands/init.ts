import { elizaLogger } from '@elizaos/core';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Command } from 'commander';
import { getConfig, defaultEnvContent } from './utils.js';

export async function initCommand() {
    try {
        const { paths } = getConfig();
        
        // Create vonNewman directory
        await mkdir(paths.rootDir, { recursive: true });

        // Create .env if it doesn't exist
        if (!existsSync(paths.envPath)) {
            await writeFile(paths.envPath, defaultEnvContent);
        }

        elizaLogger.info(`
vonNewman initialized successfully!
Configuration file created at: ${paths.envPath}

Please edit the configuration file and add your GROQ API key.
        `);
    } catch (error) {
        elizaLogger.error('Failed to initialize vonNewman:', error);
        process.exit(1);
    }
}

export function registerInitCommand(program: Command) {
    program
        .command('init')
        .description('Initialize vonNewman configuration')
        .action(initCommand);
} 
