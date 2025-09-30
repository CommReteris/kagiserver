# Suggested Commands

- `npm install` — install project dependencies defined in package.json.
- `export KAGI_API_KEY=your_api_key` — configure Kagi authentication for local sessions.
- `npm run build` — compile TypeScript from `src/` into `build/index.js` and mark executable.
- `npm run watch` — start TypeScript compiler in watch mode for iterative development.
- `npm run inspector` — launch MCP Inspector against the built server (`build/index.js`).
- `npx @modelcontextprotocol/inspector build/index.js` — alternative direct invocation of the inspector.
- `node build/index.js` — run the compiled MCP server manually over stdio (requires transport host).
- `git status` / `git diff` — standard Git workflow commands on Linux environment.