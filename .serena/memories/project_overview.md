# Project Overview

- **Purpose**: MCP server integrating Kagi search, summarization, FastGPT, and enrich APIs for LLM agents.
- **Core Components**: `src/index.ts` defines tool schemas and handlers; build output in `build/index.js` for runtime; configuration driven by `package.json` and `tsconfig.json`.
- **Architecture**: MCP `Server` with list-tools and call-tool handlers; single `KagiClient` instance shared across tool cases; stdout transport via `StdioServerTransport`.
- **Tech Stack**: TypeScript (ES2022 target, Node16 modules), Node.js runtime (20.x), MCP SDK 0.6.0, kagi-api client 0.0.21.
- **Environment**: Linux-based development; requires `KAGI_API_KEY` environment variable.
- **Notable Features**: Mutual exclusivity validation for summarize inputs, structured JSON responses per MCP protocol, default handling for optional parameters, consistent error wrapping.