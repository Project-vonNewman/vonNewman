# vonNewman

Systems Engineer AI agent for Space missions.

Right now it is implemented as comprehansive CLI app.

## Overview

vonNewman is an AI-powered agent designed to assist with business operations and knowledge management for enginering/space . It provides:
- Interactive AI assistance through terminal
- Knowledge base management with RAG capabilities
- Multi-interface support (Terminal, Telegram)
- Enterprise-grade configuration and security

## Quick Start

1. Install global dependencies:
   - NodeJS
   - pnpm

2. Clone and install dependencies:
   ```bash
   git clone https://github.com/Project-vonNewman/vonNewman.git
   cd vonNewman
   pnpm install
   ```

3. Set up development environment:
   ```bash
   # Create configuration directory
   mkdir -p ~/.vonNewman
   
   # Create and edit environment file
   cat > ~/.vonNewman/.env << EOL
   GROQ_API_KEY=your-api-key-here
   # Optional: TELEGRAM_BOT_TOKEN=your-bot-token
   EOL
   ```

4. Link the development CLI:
   ```bash
   cd apps/cli
   pnpm link-dev
   ```

5. Start using vonNewman:
   ```bash
   # Initialize vonNewman
   vonNewman-dev init
   
   # Start the agent
   vonNewman-dev start
   
   # Add knowledge to the agent
   vonNewman-dev add <path>
   ```

## Project Structure

```
vonNewman/
├── apps/
│   └── cli/                # Command-line interface
├── packages/
│   ├── core/              # Core AI agent functionality
│   ├── client-terminal/   # Terminal interface client
│   └── plugin-knowledge-manager/ # Knowledge base management
├── package.json           # Root package configuration
└── README.md             # This file
```

## Development

### Prerequisites

- Groq API key (sign up at groq.com)
- (Optional) Telegram Bot Token

### CLI Development

The vonNewman CLI supports two modes:

1. **Development Mode** (`vonNewman-dev`):
   - Runs directly from TypeScript source
   - Updates immediately when you make code changes
   - Maintains proper workspace dependencies
   - Works with the monorepo structure

2. **Production Mode** (`vonNewman`):
   - Runs from compiled JavaScript
   - Used for production deployments
   - Installed globally via npm/pnpm

For detailed CLI documentation, see [apps/cli/README.md](apps/cli/README.md).

### Environment Setup

The `.env` file in `~/.vonNewman/` supports the following variables:

```env
# Required
GROQ_API_KEY=your-api-key

# Optional
TELEGRAM_BOT_TOKEN=your-bot-token    # For Telegram integration
MODEL_PROVIDER=groq                   # AI model provider (default: groq)
```

### Available Scripts

From the root directory:
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Clean all packages
pnpm clean

# Run tests
pnpm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## License

MIT

## Support

- GitHub Issues: [Report a bug](https://github.com/Project-vonNewman/vonNewman/issues)
- Documentation: [CLI Documentation](apps/cli/README.md)
