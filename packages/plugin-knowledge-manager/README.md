# Knowledge Manager Plugin

Plugin for managing vonNewman's knowledge base. Provides RAG (Retrieval-Augmented Generation) capabilities and file processing functionality.

## Features

- File processing and indexing
- RAG provider for knowledge retrieval
- Support for multiple file types
- Recursive directory processing

## Usage

### In Code

```typescript
import { processFiles } from "@vonNewman/plugin-knowledge-manager";

// Process files
await processFiles(
    agent.ragKnowledgeManager,
    "path/to/files",
    ["md", "ts", "js"],
    true, // recursive
    agent
);

// Use RAG provider
import { createRagProvider } from "@vonNewman/plugin-knowledge-manager";

const ragProvider = createRagProvider();
agent.registerContextProvider(ragProvider);
```

### File Processing

The plugin supports processing various file types:
- Markdown (`.md`)
- TypeScript (`.ts`)
- JavaScript (`.js`)
- Text files (`.txt`)

### RAG Implementation

The plugin implements a RAG system that:
1. Embeds the input query
2. Searches the knowledge base
3. Returns relevant documentation
4. Formats the response for the agent

## Development

```bash
# Build the plugin
pnpm build

# Run tests
pnpm test
```

## Integration

The plugin integrates with the vonNewman agent system by:
1. Providing a RAG provider for knowledge retrieval
2. Managing the knowledge database
3. Processing and indexing files
4. Maintaining embeddings for semantic search 