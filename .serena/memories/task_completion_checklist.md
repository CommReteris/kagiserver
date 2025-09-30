# Task Completion Checklist

1. Rebuild the project via `npm run build` to assure TypeScript emits `build/index.js` without diagnostics.
2. If linting is configured, execute `npm run lint` (referenced in testing plan) and resolve any reported issues.
3. Validate runtime behavior with `npm run inspector`, exercising each MCP tool path or targeted scenarios relevant to the change.
4. Confirm environment prerequisites remain satisfied (`KAGI_API_KEY` present, Node.js ≥20) before handing off.
5. Review console output for `console.error` entries during tests; investigate unexpected errors.
6. Document observed results, failures, and follow-up actions in the task handoff or pull-request summary.