import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { UUID, ModelProviderName } from '@elizaos/core';

export async function checkEnvironment() {
    try {
        const { paths } = getConfig();
        
        if (!existsSync(paths.envPath)) {
            throw new Error('vonNewman is not initialized. Please run: vonNewman init');
        }

        const envContent = await readFile(paths.envPath, 'utf-8');
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-api-key-here') {
            throw new Error('GROQ API key not configured. Please edit ~/.vonNewman/.env');
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to check environment: ' + String(error));
    }
}

export function getvonNewmanDir() {
    return getConfig().paths.rootDir;
}

export interface CliPaths {
    rootDir: string;
    dbPath: string;
    envPath: string;
}

export interface CliConfig {
    agentId: UUID;
    modelProvider: ModelProviderName;
    paths: CliPaths;
    defaultFileTypes: string[];
}

export function getPaths(): CliPaths {
    const rootDir = join(homedir(), '.vonNewman');
    return {
        rootDir,
        dbPath: join(rootDir, 'db.sqlite'),
        envPath: join(rootDir, '.env'),
    };
}

export function getConfig(): CliConfig {
    return {
        agentId: "agent-0000-0000-0000-000000" as UUID,
        modelProvider: "groq" as ModelProviderName,
        paths: getPaths(),
        defaultFileTypes: ['md', 'txt', 'js', 'ts']
    };
}

export const defaultEnvContent = `# vonNewman Configuration
MODEL_PROVIDER=groq
MODEL_API_KEY=your-api-key-here
`; 
