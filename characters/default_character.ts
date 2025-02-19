import { defaultCharacter } from "@elizaos/core";
import type { Character } from "@elizaos/core";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and parse the JSON file
const vonNewman = JSON.parse(
    readFileSync(join(__dirname, 'vonNewman.character.json'), 'utf-8')
);

export const character: Character = {
    ...defaultCharacter,
    ...vonNewman,
    // Override any specific defaults if needed
    modelProvider: "groq",
    clients: [],
    settings: {
        ...defaultCharacter.settings,
        ...vonNewman.settings,
        secrets: {
            ...defaultCharacter.settings?.secrets,
            ...vonNewman.settings?.secrets,
        },
        voice: {
            model: "en_US-male-medium"
        }
    },
    clientConfig: {
        telegram: {
            shouldIgnoreBotMessages: true,
            shouldIgnoreDirectMessages: false,
            shouldOnlyJoinInAllowedGroups: false,
            shouldRespondOnlyToMentions: false
        }
    }
};
