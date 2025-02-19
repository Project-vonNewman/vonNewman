import type { IAgentRuntime } from "@elizaos/core";
import { promises as fs } from "fs";
import { join } from 'path';
import { elizaLogger } from '@elizaos/core';

// Add interface for config
export interface DocsConfig {
  sources: {
    path: string;
    recursive: boolean;
    fileTypes: string[];
  }[];
  defaultFileTypes: string[];
  options?: {
    chunkSize?: number;
    overlap?: number;
  };
}

// Function to read config
export async function readConfig(configPath: string): Promise<DocsConfig> {
  try {
    // First check if file exists and is not a directory
    const stats = await fs.stat(configPath);
    if (!stats.isFile()) {
      throw new Error(`Path ${configPath} is not a file`);
    }

    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Validate config structure
    if (!config.sources || !Array.isArray(config.sources)) {
      throw new Error('Invalid config: missing or invalid "sources" array');
    }

    if (!config.defaultFileTypes || !Array.isArray(config.defaultFileTypes)) {
      config.defaultFileTypes = ['.md']; // Set default if not provided
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      elizaLogger.error('Error reading config file:', error.message);
    } else {
      elizaLogger.error('Unknown error reading config file');
    }
    throw error;
  }
}

// File processing function
export async function processFiles(
  ragManager: any,
  sourcePath: string,
  fileTypes: string[],
  recursive: boolean,
  runtime: IAgentRuntime
): Promise<void> {
    const processDirectory = async (dirPath: string) => {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = join(dirPath, file.name);
            
            if (file.isDirectory() && recursive) {
                await processDirectory(fullPath);
                continue;
            }
            
            if (!file.isFile()) continue;
            
            if (fileTypes.some(type => file.name.endsWith(type))) {
                try {
                    elizaLogger.info(`Processing ${file.name}...`);
                    const content = await fs.readFile(fullPath, 'utf8');
                    elizaLogger.debug(`File content length: ${content.length} characters`);

                    const processOptions = {
                        path: file.name,
                        content: content,
                        type: "md" as const,
                        isShared: true
                    };

                    await ragManager.processFile(processOptions);
                    elizaLogger.info(`Successfully processed ${file.name}`);
                } catch (error) {
                    elizaLogger.error(`Error processing ${file.name}:`, error);
                }
            }
        }
    };

    await processDirectory(sourcePath);
} 