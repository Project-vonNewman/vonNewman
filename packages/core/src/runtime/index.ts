import { 
  AgentRuntime, 
  ModelProviderName,
  DbCacheAdapter,
  CacheManager,
  elizaLogger
} from "@elizaos/core";
import type { Plugin, UUID } from "@elizaos/core";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import { character } from "@vonNewman/characters";

export async function createAgent(config: {
    dbPath: string;
    agentId: UUID;
    token: string;
    plugins?: Plugin[];
}) {
    // Initialize database
    const db = new SqliteDatabaseAdapter(new Database(config.dbPath));
    await db.init();

    // Initialize cache
    const cacheAdapter = new DbCacheAdapter(db, config.agentId);
    const cacheManager = new CacheManager(cacheAdapter);

    if (!character) {
        elizaLogger.error("Failed to load character configuration");
        throw new Error("Failed to load character configuration");
    }
    // Create runtime
    const runtime = new AgentRuntime({
        databaseAdapter: db,
        modelProvider: "groq" as ModelProviderName,
        token: config.token,
        character: character,
        plugins: config.plugins || [],
        cacheManager,
        agentId: config.agentId
    });

    await runtime.initialize();
    return runtime;
} 