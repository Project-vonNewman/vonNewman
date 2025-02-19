import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    embed,
    elizaLogger
} from "@elizaos/core";

export interface SearchKnowledgeResult {
    success: boolean;
    matches: Array<{
        text: string;
        similarity: number;
        metadata: Record<string, any>;
    }>;
    error?: string;
}

/**
 * Action to search through the knowledge base using semantic search
 */
export const searchKnowledgeAction: Action = {
    name: "SEARCH_KNOWLEDGE",
    similes: [
        "FIND_KNOWLEDGE",
        "QUERY_KNOWLEDGE",
        "SEARCH_DOCS",
        "FIND_DOCS"
    ],
    description: "Search through the knowledge base using semantic search",
    validate: async (runtime: IAgentRuntime) => {
        try {
            return !!runtime.ragKnowledgeManager;
        } catch (error) {
            elizaLogger.error("Failed to validate knowledge manager:", error);
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
            elizaLogger.info("[Search Knowledge] Processing query:", message.content.text);
            
            const knowledgeManager = runtime.ragKnowledgeManager;
            if (!knowledgeManager) {
                throw new Error("Knowledge manager not available");
            }

            // Parse options
            const matchCount = typeof options?.matchCount === 'number' ? options.matchCount : 5;
            const matchThreshold = typeof options?.matchThreshold === 'number' ? options.matchThreshold : 0.75;

            // Generate embedding for the query
            elizaLogger.info("[Search Knowledge] Generating embedding");
            const embedding = await embed(runtime, message.content.text);
            elizaLogger.info("[Search Knowledge] Embedding generated successfully");
            
            // Search knowledge base
            elizaLogger.info("[Search Knowledge] Searching knowledge base");
            const relevantKnowledge = await knowledgeManager.searchKnowledge({
                agentId: runtime.agentId,
                embedding,
                match_count: matchCount,
                match_threshold: matchThreshold
            });

            if (!relevantKnowledge || relevantKnowledge.length === 0) {
                elizaLogger.info("[Search Knowledge] No relevant knowledge found");
                if (callback) {
                    callback({
                        text: "No relevant knowledge found in the database.",
                        metadata: { matches: [] }
                    });
                }
                return {
                    success: true,
                    matches: [],
                    message: "No relevant knowledge found in the database."
                };
            }

            elizaLogger.info("[Search Knowledge] Found", relevantKnowledge.length, "relevant entries");
            
            // Process and format results
            const matches = relevantKnowledge
                .map((k) => {
                    try {
                        const content = typeof k.content === 'string' ? JSON.parse(k.content) : k.content;
                        return {
                            text: content.text?.trim() || "",
                            similarity: k.similarity || 0,
                            metadata: content.metadata || {}
                        };
                    } catch (err) {
                        elizaLogger.error("[Search Knowledge] Error processing entry:", err);
                        return null;
                    }
                })
                .filter((match): match is { text: string; similarity: number; metadata: Record<string, any> } => 
                    match !== null
                );

            // Format results for display
            const formattedResults = matches.map((match, index) => ({
                ...match,
                formattedText: `${index + 1}. ${match.text} (similarity: ${(match.similarity * 100).toFixed(1)}%)`
            }));

            const resultMessage = matches.length > 0
                ? `Found ${matches.length} relevant matches:\n\n${formattedResults.map(r => r.formattedText).join('\n\n')}`
                : "No relevant knowledge found in the database.";

            if (callback) {
                callback({
                    text: resultMessage,
                    metadata: { matches }
                });
            }

            return {
                success: true,
                matches: formattedResults,
                message: resultMessage
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            elizaLogger.error("[Search Knowledge] Error:", error);
            if (callback) {
                callback({
                    text: errorMessage,
                    error: true
                });
            }
            return {
                success: false,
                matches: [],
                error: errorMessage
            };
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Search knowledge about lunar habitats",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "SEARCH_KNOWLEDGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Find docs about life support systems",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "SEARCH_KNOWLEDGE",
                },
            },
        ],
    ],
}; 