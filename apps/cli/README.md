# vonNewman CLI

Command-line interface for vonNewman - Enterprise AI Agent.

## Overview

The vonNewman CLI provides command-line access to vonNewman's features:
- Interactive AI agent sessions
- Knowledge base management
- Configuration and environment setup
- Multi-interface support (Terminal, Telegram)

## Development Setup

### Prerequisites

- Node.js v18 or higher
- pnpm v8.15.1 or higher
- Global installation of `tsx`:
  ```bash
  pnpm add -g tsx
  ```

### Quick Start

1. From the root of the monorepo:
   ```bash
   # Install dependencies
   pnpm install
   ```

2. Link the development version:
   ```bash
   cd apps/cli
   pnpm link-dev
   ```

3. Verify installation:
   ```bash
   vonNewman-dev --help
   ```

## Command Reference

### Core Commands

- `init` - Initialize vonNewman configuration
  ```bash
  vonNewman-dev init
  ```

- `start` - Start vonNewman agent
  ```bash
  vonNewman-dev start
  ```

- `add <path>` - Add files or documents to knowledge base
  ```bash
  vonNewman-dev add ./docs --types="md,txt" --recursive
  ```

### Maintenance Commands

- `clean` - Clean vonNewman database
  ```bash
  vonNewman-dev clean
  ```

- `uninstall` - Remove vonNewman configuration and data
  ```bash
  vonNewman-dev uninstall
  ```

### Command Options

#### Add Command
```bash
vonNewman-dev add <path> [options]

Options:
  -t, --types <types>    File types to process (default: "md,txt,js,ts")
  -r, --recursive        Process directories recursively (default: true)
```

## Project Structure

```
apps/cli/
├── src/
│   ├── commands/     # Command implementations
│   │   ├── add.ts   # Knowledge base management
│   │   ├── clean.ts # Database maintenance
│   │   ├── init.ts  # Environment setup
│   │   └── start.ts # Agent startup
│   ├── utils/       # Shared utilities
│   └── index.ts     # CLI entry point
├── package.json     # Package configuration
└── README.md       # This file
```

## Development Scripts

- `pnpm build` - Build for production
- `pnpm start` - Run locally
- `pnpm dev` - Run with watch mode
- `pnpm clean` - Clean artifacts
- `pnpm link-dev` - Link globally
- `pnpm unlink` - Remove global link
- `pnpm typecheck` - Type checking

## Configuration

### Environment Variables

The CLI reads configuration from `~/.vonNewman/.env`:

```env
# Required
GROQ_API_KEY=your-api-key

# Optional
TELEGRAM_BOT_TOKEN=your-bot-token    # For Telegram integration
MODEL_PROVIDER=groq                   # AI model provider (default: groq)
```

### Data Storage

- Configuration: `~/.vonNewman/.env`
- Database: `~/.vonNewman/db.sqlite`
- Logs: `~/.vonNewman/logs/`

## Contributing

1. Create a feature branch from `dev`
2. Implement your changes
3. Add tests if applicable
4. Update documentation
5. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style
- Add JSDoc comments for public APIs
- Update command help text when adding options

## License

MIT 