# Phase 1: Kagi MCP Server Extension - Implementation Architecture

## Project Context

**Location**: `/home/rengo/.local/share/Roo-Code/MCP/kagiserver/src/index.ts`  
**Current Version**: 0.1.0  
**Target Version**: 0.2.0  
**Existing Tools**: 1 (kagi_search)  
**New Tools**: 3 (kagi_summarize, kagi_fastgpt, kagi_enrich)

## Architecture Overview

### Current Implementation Pattern

The existing `kagi_search` tool follows this pattern:

1. **Tool Definition** (in `ListToolsRequestSchema` handler):
   - Tool name
   - Description
   - Input schema with properties and required fields
   - Type constraints (string, number, enums)

2. **Tool Handler** (in `CallToolRequestSchema` handler):
   - Parameter extraction with type casting
   - Validation of required parameters
   - API invocation with error handling
   - Response formatting as MCP-compliant JSON

3. **Error Handling**:
   - Input validation errors thrown early
   - API errors caught and wrapped with descriptive messages
   - All errors include context for debugging

## Tool Specifications

### 1. kagi_summarize

**Purpose**: Summarize web pages or text content using Kagi's summarization engine

**API Signature**:
```typescript
kagi.summarize(url?, text?, engine?, summary_type?, target_language?, cache?)
```

**Input Schema Design**:
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "URL of the web page to summarize"
    },
    "text": {
      "type": "string",
      "description": "Text content to summarize (alternative to URL)"
    },
    "engine": {
      "type": "string",
      "enum": ["cecil", "agnes", "daphne", "muriel"],
      "default": "cecil",
      "description": "Summarization engine to use"
    },
    "summary_type": {
      "type": "string",
      "enum": ["summary", "takeaway"],
      "default": "summary",
      "description": "Type of summary to generate"
    },
    "target_language": {
      "type": "string",
      "description": "Target language for the summary (optional)"
    },
    "cache": {
      "type": "boolean",
      "default": true,
      "description": "Whether to use cached results"
    }
  },
  "oneOf": [
    {"required": ["url"]},
    {"required": ["text"]}
  ]
}
```

**Key Design Decisions**:
- **Mutual Exclusivity**: `url` and `text` are mutually exclusive (enforced via `oneOf`)
- **Default Values**: `engine="cecil"`, `summary_type="summary"`, `cache=true`
- **Optional Parameters**: `target_language` is optional

**Handler Implementation Pattern**:
```typescript
case "kagi_summarize": {
  // Extract parameters
  const url = request.params.arguments?.url ? String(request.params.arguments.url) : undefined;
  const text = request.params.arguments?.text ? String(request.params.arguments.text) : undefined;
  
  // Validate mutual exclusivity
  if (!url && !text) {
    throw new Error("Either url or text is required");
  }
  if (url && text) {
    throw new Error("Only one of url or text should be provided");
  }
  
  // Extract optional parameters with defaults
  const engine = String(request.params.arguments?.engine || "cecil");
  const summary_type = String(request.params.arguments?.summary_type || "summary");
  const target_language = request.params.arguments?.target_language 
    ? String(request.params.arguments.target_language) 
    : undefined;
  const cache = request.params.arguments?.cache !== undefined 
    ? Boolean(request.params.arguments.cache) 
    : true;
  
  try {
    const results = await kagi.summarize(url, text, engine, summary_type, target_language, cache);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  } catch (error) {
    console.error("KagiAPI error:", error);
    throw new Error(`Summarization failed: ${(error as Error).message}`);
  }
}
```

### 2. kagi_fastgpt

**Purpose**: Get AI-generated answers with cited references using Kagi's FastGPT

**API Signature**:
```typescript
kagi.fastgpt(query, cache?)
```

**Input Schema Design**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Question or query for FastGPT"
    },
    "cache": {
      "type": "boolean",
      "default": true,
      "description": "Whether to use cached results"
    }
  },
  "required": ["query"]
}
```

**Key Design Decisions**:
- **Required Parameter**: `query` is required
- **Default Value**: `cache=true`
- **Simple Schema**: Only 2 parameters, straightforward validation

**Handler Implementation Pattern**:
```typescript
case "kagi_fastgpt": {
  const query = String(request.params.arguments?.query);
  
  if (!query) {
    throw new Error("Query is required");
  }
  
  const cache = request.params.arguments?.cache !== undefined 
    ? Boolean(request.params.arguments.cache) 
    : true;
  
  try {
    const results = await kagi.fastgpt(query, cache);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  } catch (error) {
    console.error("KagiAPI error:", error);
    throw new Error(`FastGPT query failed: ${(error as Error).message}`);
  }
}
```

### 3. kagi_enrich

**Purpose**: Get enhanced search results from Kagi's curated indexes

**API Signature**:
```typescript
kagi.enrich(query)
```

**Input Schema Design**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query for enriched results"
    }
  },
  "required": ["query"]
}
```

**Key Design Decisions**:
- **Simplest Tool**: Only one required parameter
- **No Optional Parameters**: Unlike other tools, enrich has no cache or other options
- **Straightforward Validation**: Single required string parameter

**Handler Implementation Pattern**:
```typescript
case "kagi_enrich": {
  const query = String(request.params.arguments?.query);
  
  if (!query) {
    throw new Error("Query is required");
  }
  
  try {
    const results = await kagi.enrich(query);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  } catch (error) {
    console.error("KagiAPI error:", error);
    throw new Error(`Enrich query failed: ${(error as Error).message}`);
  }
}
```

## Code Quality Standards

### Type Safety
1. **Parameter Type Casting**: Always use explicit type conversions
   - `String(value)` for string parameters
   - `Number(value)` for numeric parameters
   - `Boolean(value)` for boolean parameters

2. **Optional Parameter Handling**: Use ternary operators with type checks
   ```typescript
   const param = request.params.arguments?.param 
     ? String(request.params.arguments.param) 
     : undefined;
   ```

3. **Error Type Assertions**: Cast caught errors to `Error` type
   ```typescript
   (error as Error).message
   ```

### Error Handling Patterns

1. **Validation Errors**: Throw immediately with descriptive messages
   ```typescript
   if (!requiredParam) {
     throw new Error("Parameter X is required");
   }
   ```

2. **API Errors**: Catch, log, and wrap with context
   ```typescript
   catch (error) {
     console.error("KagiAPI error:", error);
     throw new Error(`Operation failed: ${(error as Error).message}`);
   }
   ```

3. **Unknown Tool**: Default case in switch statement
   ```typescript
   default:
     throw new Error("Unknown tool");
   ```

### Response Formatting

All tool responses must follow MCP protocol:
```typescript
return {
  content: [{
    type: "text",
    text: JSON.stringify(results, null, 2)
  }]
};
```

**Requirements**:
- `content` is an array
- Each item has `type: "text"`
- `text` contains JSON-formatted string with 2-space indentation
- Results are the raw API response (not modified)

## Implementation Checklist

### Tool Definitions (ListToolsRequestSchema)
- [ ] Add `kagi_summarize` to tools array
  - [ ] Verify `name` field
  - [ ] Verify `description` field
  - [ ] Verify `inputSchema` structure
  - [ ] Verify `properties` definitions
  - [ ] Verify `required` array
  - [ ] Verify `oneOf` constraint for url/text
  - [ ] Verify `default` values

- [ ] Add `kagi_fastgpt` to tools array
  - [ ] Verify `name` field
  - [ ] Verify `description` field
  - [ ] Verify `inputSchema` structure
  - [ ] Verify `properties` definitions
  - [ ] Verify `required` array
  - [ ] Verify `default` value for cache

- [ ] Add `kagi_enrich` to tools array
  - [ ] Verify `name` field
  - [ ] Verify `description` field
  - [ ] Verify `inputSchema` structure
  - [ ] Verify `properties` definitions
  - [ ] Verify `required` array

### Tool Handlers (CallToolRequestSchema)
- [ ] Implement `kagi_summarize` case
  - [ ] Extract url parameter
  - [ ] Extract text parameter
  - [ ] Validate mutual exclusivity
  - [ ] Extract engine with default
  - [ ] Extract summary_type with default
  - [ ] Extract target_language (optional)
  - [ ] Extract cache with default
  - [ ] Add try-catch block
  - [ ] Call `kagi.summarize()`
  - [ ] Format response
  - [ ] Add error logging

- [ ] Implement `kagi_fastgpt` case
  - [ ] Extract query parameter
  - [ ] Validate query is provided
  - [ ] Extract cache with default
  - [ ] Add try-catch block
  - [ ] Call `kagi.fastgpt()`
  - [ ] Format response
  - [ ] Add error logging

- [ ] Implement `kagi_enrich` case
  - [ ] Extract query parameter
  - [ ] Validate query is provided
  - [ ] Add try-catch block
  - [ ] Call `kagi.enrich()`
  - [ ] Format response
  - [ ] Add error logging

### Code Quality Review
- [ ] All type assertions are correct
- [ ] Error messages are descriptive and actionable
- [ ] Response formatting matches MCP protocol
- [ ] Required parameters are validated
- [ ] Optional parameters have proper defaults
- [ ] Code style matches existing patterns
- [ ] No TypeScript compilation errors
- [ ] Console logging is consistent

## Testing Strategy

### Manual Testing Checklist

**kagi_summarize**:
1. Test with URL only
2. Test with text only
3. Test with both URL and text (should fail)
4. Test with neither URL nor text (should fail)
5. Test with different engines (cecil, agnes, daphne, muriel)
6. Test with different summary types (summary, takeaway)
7. Test with target_language
8. Test with cache=false

**kagi_fastgpt**:
1. Test with simple query
2. Test without query (should fail)
3. Test with cache=false

**kagi_enrich**:
1. Test with simple query
2. Test without query (should fail)

### Expected Outcomes
- All required parameter validations should throw errors
- All API calls should return properly formatted JSON
- Error messages should include context
- Response structure should match MCP protocol

## Version Update

Update `package.json`:
```json
{
  "name": "kagiserver",
  "version": "0.2.0",
  ...
}
```

Also update version in server initialization:
```typescript
const server = new Server(
  {
    name: "kagiserver",
    version: "0.2.0",
  },
  ...
);
```

## Dependencies

**No new dependencies required**:
- `kagi-api` package already provides all four methods
- MCP SDK types remain unchanged
- TypeScript configuration unchanged

## File Structure

**Modified Files**:
- `/home/rengo/.local/share/Roo-Code/MCP/kagiserver/src/index.ts` (main implementation)
- `/home/rengo/.local/share/Roo-Code/MCP/kagiserver/package.json` (version bump)

**No new files required**

## Estimated Implementation Time

- Tool definitions: 10 minutes
- Handler implementations: 12 minutes
- Testing and validation: 8 minutes
- Code review: 5 minutes

**Total**: ~35 minutes (includes buffer beyond original 25-minute estimate)

## Success Criteria

1. ✅ All three new tools appear in `npx @modelcontextprotocol/inspector kagiserver`
2. ✅ Each tool can be invoked with valid parameters
3. ✅ Invalid parameter combinations are rejected with clear error messages
4. ✅ API responses are properly formatted as MCP-compliant JSON
5. ✅ Error handling works for both validation and API failures
6. ✅ Code follows existing style patterns
7. ✅ No TypeScript compilation errors
8. ✅ Version updated to 0.2.0

## Next Phase Preview

After Phase 1 completion, the next steps will be:
- **Phase 2**: Update Dockerfile and rebuild container image
- **Phase 3**: Push to Harbor registry
- **Phase 4**: Create Kubernetes manifests
- **Phase 5**: Deploy to cluster with FluxCD
- **Phase 6**: Test integrated deployment

## References

- [Kagi API Documentation](https://help.kagi.com/kagi/api/summarizer.html)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [kagi-api NPM Package](https://www.npmjs.com/package/kagi-api)