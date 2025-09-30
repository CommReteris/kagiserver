# Code Style and Conventions

- **Type Handling**: Convert inbound arguments explicitly using constructors (`String`, `Number`, `Boolean`). Optional inputs follow ternary guards returning `undefined` when absent.
- **Error Handling**: Validation failures throw `Error` with descriptive messages immediately. External Kagi API calls reside in `try/catch` blocks logging via `console.error` before rethrowing contextual errors such as `Summarization failed: ...`.
- **Response Structure**: All tools return `{ content: [{ type: "text", text: JSON.stringify(results, null, 2) }] }`, preserving unmodified API payloads with 2-space indentation.
- **Logging Policy**: Use `console.error` only; avoid `console.log` statements.
- **Formatting**: CamelCase identifiers, 2-space indentation, no `any` types, rely on strict TypeScript configuration. Maintain XOR validation (`url` vs `text`) and limit clamping for numeric parameters.
- **Version Alignment**: Server metadata version string in `Server` constructor must match `package.json`.