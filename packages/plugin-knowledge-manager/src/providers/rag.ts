import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { embed, elizaLogger } from "@elizaos/core";

/**
 * RAG Provider that integrates with the agent's knowledge base.
 */
export const ragProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> => {
        try {
            elizaLogger.info("[RAG Provider] Processing message:", message.content.text);
            
            const knowledgeManager = runtime.ragKnowledgeManager;
            if (!knowledgeManager) {
                elizaLogger.warn("[RAG Provider] No knowledge manager available");
                return null;
            }

            // Generate embedding for the query
            elizaLogger.debug("[RAG Provider] Generating embedding for message");
            const embedding = await embed(runtime, message.content.text);
            elizaLogger.debug("[RAG Provider] Embedding generated successfully");
            
            // Search for relevant knowledge
            elizaLogger.debug("[RAG Provider] Searching knowledge base");
            const relevantKnowledge = await knowledgeManager.searchKnowledge({
                agentId: runtime.agentId,
                embedding,
                match_count: 5,
                match_threshold: 0.75
            });

            if (!relevantKnowledge || relevantKnowledge.length === 0) {
                elizaLogger.debug("[RAG Provider] No relevant knowledge found");
                return null;
            }

            elizaLogger.debug("[RAG Provider] Found", relevantKnowledge.length, "relevant entries");
            
            // Process each knowledge entry
            const processedEntries: string[] = [];
            for (let i = 0; i < relevantKnowledge.length; i++) {
                const entry = relevantKnowledge[i];
                elizaLogger.debug(`[RAG Provider] Processing entry ${i + 1}:`, {
                    similarity: entry.similarity,
                    content: typeof entry.content === 'string' 
                        ? entry.content.substring(0, 100) + "..."
                        : entry.content.text.substring(0, 100) + "..."
                });
                
                const content = typeof entry.content === 'string' 
                    ? JSON.parse(entry.content) 
                    : entry.content;
                processedEntries.push(content.text?.trim() || null);
            }

            // Process and format results
            const formattedKnowledge = processedEntries.filter(Boolean).join('\n\n');

            if (!formattedKnowledge) {
                elizaLogger.debug("[RAG Provider] No valid knowledge entries after processing");
                return null;
            }

            elizaLogger.debug("[RAG Provider] Returning formatted knowledge of length:", formattedKnowledge.length);
            return formattedKnowledge;
        } catch (error) {
            elizaLogger.error("[RAG Provider] Error in provider:", error);
            return null;
        }
    }
}; 
