import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { Command } from 'commander';
import { getvonNewmanDir } from './utils.js';
import { elizaLogger } from '@elizaos/core';

export async function uninstallCommand() {
    try {
        const vonNewmanDirPath = getvonNewmanDir();
        
        if (!existsSync(vonNewmanDirPath)) {
            elizaLogger.info('vonNewman is not installed.');
            return;
        }

        await rm(vonNewmanDirPath, { recursive: true });
        elizaLogger.info('vonNewman uninstalled successfully.');
    } catch (error) {
        elizaLogger.error('Failed to uninstall vonNewman:', error);
        process.exit(1);
    }
}

export function registerUninstallCommand(program: Command) {
    program
        .command('uninstall')
        .description('Remove vonNewman configuration and data')
        .action(uninstallCommand);
} 