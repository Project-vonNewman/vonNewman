import type { Plugin } from "@elizaos/core";
import { processDocumentsAction } from "./actions/processDocuments";
import { searchDocumentsAction } from "./actions/searchDocuments";
import { searchKnowledgeAction } from "./actions/searchKnowledge";
import { ragProvider } from "./providers/rag";

export { processDocumentsAction, searchDocumentsAction, searchKnowledgeAction };

/**
 * Knowledge Manager Plugin
 * Provides RAG capabilities for document search and retrieval
 */
export const knowledgeManagerPlugin: Plugin = {
    name: "knowledge-manager",
    description: "Knowledge management and RAG capabilities for agents",
    actions: [
        processDocumentsAction,
        searchDocumentsAction,
        searchKnowledgeAction,
        // TODO: Add more actions for:
        // - createKnowledge
        // - removeKnowledge
        // - clearKnowledge
    ],
    providers: [ragProvider],
    evaluators: [],
    services: []
};

// Export the provider directly for manual registration if needed
export { ragProvider };

export default knowledgeManagerPlugin; 