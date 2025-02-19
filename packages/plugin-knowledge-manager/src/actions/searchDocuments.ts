import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    embed
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

interface SearchOptions {
    query?: string;
    limit?: number;
    threshold?: number;
}

export const searchDocumentsAction: Action = {
    name: "SEARCH_DOCUMENTS",
    similes: [
        "SEARCH_KNOWLEDGE",
        "QUERY_KNOWLEDGE",
        "FIND_DOCUMENTS",
        "SEARCH",
        "FIND"
    ],
    description: "Search through the knowledge base using RAG capabilities",
    
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
            const opts = options as SearchOptions;
            const query = opts?.query || message.content.text;
            
            if (!query) {
                throw new Error("Query is required for search.");
            }

            elizaLogger.debug('RAG Search:', {
                query: message.content.text,
                options
            });

            // Use the RAG provider to search
            const result = await runtime.ragKnowledgeManager.searchKnowledge({
                agentId: runtime.agentId,
                embedding: await embed(runtime, query),
                match_count: opts?.limit || 10,
                match_threshold: opts?.threshold || 0.9,
                searchText: query
            });

            elizaLogger.debug('RAG Search Results:', {
                query,
                resultCount: result.length,
                hasResults: result.length > 0,
                topScore: result[0]?.similarity
            });

            if (!result || result.length === 0) {
                if (callback) {
                    callback({
                        text: "No relevant documents found.",
                        metadata: { query }
                    });
                }
                return false;
            }

            const formattedResults = result
                .map((item, index) => {
                    const source = item.content.metadata?.source || 'unknown';
                    const score = ((item.similarity || 0) * 100).toFixed(2);
                    return `${index + 1}. [${score}%] ${source}:\n${item.content.text}`;
                })
                .join('\n\n');

            if (callback) {
                callback({
                    text: `Found ${result.length} relevant documents:\n\n${formattedResults}`,
                    metadata: { query, resultCount: result.length }
                });
            }

            return true;
        } catch (error: any) {
            elizaLogger.error('Search error:', error);
            if (callback) {
                callback({
                    text: `Error searching documents: ${error.message}`,
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
                    text: "How to install the application?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Found relevant documentation about installation...",
                },
            },
        ]
    ]
}; 