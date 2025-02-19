import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger,
} from "@elizaos/core";
import { readConfig } from '../documentProcessor';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';

interface ProcessOptions {
    configPath?: string;
    path?: string;
    types?: string[];
    recursive?: boolean;
    chunkSize?: number;
    overlap?: number;
}

export const processDocumentsAction: Action = {
    name: "PROCESS_DOCUMENTS",
    similes: [
        "LOAD_DOCUMENTS",
        "IMPORT_DOCUMENTS",
        "PROCESS_FILES",
        "LOAD_FILES",
        "IMPORT_FILES",
        "ADD_TO_KNOWLEDGE",
        "UPDATE_KNOWLEDGE"
    ],
    description: "Process documents and add them to the knowledge base. Supports both direct file processing and config-based processing.",
    
    validate: async (runtime: IAgentRuntime) => {
        try {
            return !!runtime.ragKnowledgeManager;
        } catch (error) {
            return false;
        }
    },
    
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: Record<string, unknown> | undefined,
        callback?: HandlerCallback
    ) => {
        try {
            const opts = options as ProcessOptions;
            
            // If config path is provided, use config-based processing
            if (opts?.configPath || (message.content.text && message.content.text.endsWith('.json'))) {
                const configPath = opts?.configPath || message.content.text;
                return await processWithConfig(runtime, configPath, callback);
            }
            
            // Otherwise use direct processing
            const path = opts?.path || message.content.text;
            if (!path) {
                throw new Error("Path is required. Please provide a path to process or a config file.");
            }

            return await processDirectly(runtime, {
                path,
                types: opts?.types || ['.md', '.txt'],
                recursive: opts?.recursive !== false,
                chunkSize: opts?.chunkSize || 512,
                overlap: opts?.overlap || 20
            }, callback);
            
        } catch (error: any) {
            if (callback) {
                callback({
                    text: `Error processing documents: ${error.message}`,
                    error: true,
                    metadata: { error }
                });
            }
            return false;
        }
    },
    
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "/path/to/docs-config.json",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Successfully processed documents from config",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "./docs",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Successfully processed documents from directory",
                },
            },
        ]
    ]
};

async function processWithConfig(
    runtime: IAgentRuntime,
    configPath: string,
    callback?: HandlerCallback
): Promise<boolean> {
    const config = await readConfig(configPath);
    let processedCount = 0;
    
    for (const source of config.sources) {
        if (callback) {
            callback({
                text: `Processing source: ${source.path}`,
                metadata: { source }
            });
        }
        
        try {
            const fileTypes = source.fileTypes.length > 0 
                ? source.fileTypes 
                : config.defaultFileTypes;

            await processDirectly(runtime, {
                path: source.path,
                types: fileTypes,
                recursive: source.recursive,
                chunkSize: config.options?.chunkSize || 512,
                overlap: config.options?.overlap || 20
            }, callback);
            
            processedCount++;
        } catch (error: any) {
            if (callback) {
                callback({
                    text: `Error processing ${source.path}: ${error.message}`,
                    error: true,
                    metadata: { error, source }
                });
            }
        }
    }
    
    if (callback) {
        callback({
            text: `Successfully processed ${processedCount} sources from config`,
            metadata: { processedCount, config }
        });
    }
    
    return processedCount > 0;
}

async function processDirectly(
    runtime: IAgentRuntime,
    options: Required<Omit<ProcessOptions, 'configPath'>>,
    callback?: HandlerCallback
): Promise<boolean> {
    let files: string[] = [];
    
    try {
        // Debug RAG initialization state
        elizaLogger.debug('RAG System State:', {
            knowledgeManager: !!runtime.ragKnowledgeManager,
            options
        });

        elizaLogger.debug('Processing with options:', {
            path: options.path,
            types: options.types,
            recursive: options.recursive
        });

        // Check if path is a file or directory
        const stats = await fs.stat(options.path);
        if (stats.isFile()) {
            // If it's a single file, just use that
            files = [options.path];
            elizaLogger.debug('Found single file:', options.path);
        } else if (stats.isDirectory()) {
            // If it's a directory, use glob pattern
            const pattern = options.recursive 
                ? `${options.path}/**/*`
                : `${options.path}/*`;
            files = await glob(pattern, { nodir: true });
            elizaLogger.debug('Found files in directory:', files);
        }
    } catch (error: any) {
        elizaLogger.error('Error accessing path:', error);
        if (callback) {
            callback({
                text: `Error accessing path ${options.path}: ${error.message}`,
                error: true,
                metadata: { error }
            });
        }
        return false;
    }
    
    let processedCount = 0;
    
    for (const file of files) {
        const ext = extname(file);
        elizaLogger.debug('Checking file:', file, 'with extension:', ext, 'against types:', options.types);
        // Ensure both the extension and types have the dot prefix for comparison
        if (!options.types.includes(ext) && !options.types.includes(ext.substring(1))) {
            elizaLogger.debug('Skipping file due to extension mismatch');
            continue;
        }
        
        try {
            elizaLogger.debug('Reading file:', file);
            const content = await fs.readFile(file, 'utf8');
            elizaLogger.debug('Processing file with content length:', content.length);
            
            if (!runtime.ragKnowledgeManager) {
                throw new Error('RAG Knowledge Manager not initialized');
            }

            // Debug RAG processing steps
            elizaLogger.debug('RAG Processing Steps:', {
                step: 'Starting file processing',
                file,
                type: getFileType(ext),
                contentPreview: content.substring(0, 100) + '...'
            });

            // Generate a unique ID for debugging
            const debugId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            elizaLogger.debug('RAG Operation ID:', debugId);

            try {
                // Debug before processing
                const beforeKnowledge = await runtime.ragKnowledgeManager.getKnowledge({
                    agentId: runtime.agentId
                });
                elizaLogger.debug('RAG Knowledge Before:', {
                    operationId: debugId,
                    knowledgeCount: beforeKnowledge.length
                });

                // Process the file
                await runtime.ragKnowledgeManager.processFile({
                    path: file,
                    content,
                    type: getFileType(ext),
                    isShared: false
                });

                // Debug after processing
                const afterKnowledge = await runtime.ragKnowledgeManager.getKnowledge({
                    agentId: runtime.agentId
                });
                elizaLogger.debug('RAG Knowledge After:', {
                    operationId: debugId,
                    knowledgeCount: afterKnowledge.length,
                    newItemsAdded: afterKnowledge.length - beforeKnowledge.length
                });

                // Debug embeddings
                elizaLogger.debug('RAG Embedding Status:', {
                    operationId: debugId,
                    hasEmbeddings: afterKnowledge.some(k => k.embedding && k.embedding.length > 0),
                    embeddingDimensions: afterKnowledge[0]?.embedding?.length || 0
                });

            } catch (ragError: any) {
                elizaLogger.error('RAG Processing Error:', {
                    operationId: debugId,
                    error: ragError.message,
                    stack: ragError.stack,
                    phase: 'processing',
                    file
                });
                throw ragError;
            }
            
            processedCount++;
            
            if (callback) {
                callback({
                    text: `Successfully processed ${file}`,
                    metadata: { file }
                });
            }
        } catch (error: any) {
            elizaLogger.error('Error processing file:', file, error);
            if (callback) {
                callback({
                    text: `Error processing ${file}: ${error.message}`,
                    error: true,
                    metadata: { error, file }
                });
            }
        }
    }
    
    // Final RAG status
    if (runtime.ragKnowledgeManager) {
        try {
            const finalKnowledge = await runtime.ragKnowledgeManager.getKnowledge({
                agentId: runtime.agentId
            });
            elizaLogger.debug('Final RAG Status:', {
                totalKnowledgeItems: finalKnowledge.length,
                processedInThisRun: processedCount,
                hasEmbeddings: finalKnowledge.some(k => k.embedding && k.embedding.length > 0)
            });
        } catch (error) {
            elizaLogger.error('Error getting final RAG status:', error);
        }
    }
    
    if (callback) {
        callback({
            text: `Successfully processed ${processedCount} files from ${options.path}`,
            metadata: { processedCount, path: options.path }
        });
    }
    
    return processedCount > 0;
}

function getFileType(extension: string): "pdf" | "md" | "txt" {
    switch (extension.toLowerCase()) {
        case ".pdf":
            return "pdf";
        case ".md":
            return "md";
        default:
            return "txt";
    }
} 
