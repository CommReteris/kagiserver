# Kagi MCP Server Extension

## Introduction

This Model Context Protocol (MCP) server provides integration with Kagi's search and AI capabilities. The server exposes four tools for LLM agents: web search, content summarization, AI-assisted question answering (FastGPT), and enriched search results from curated indexes.

The implementation follows the MCP specification and utilizes the official Kagi API client library to deliver search functionality, text and URL summarization with multiple engine options, AI-generated responses with citations, and access to Kagi's enhanced search indexes.

## Build Guide

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Kagi API key (obtain from your Kagi account settings)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Configuration

Set the required environment variable for Kagi API authentication:

```bash
export KAGI_API_KEY=your_api_key_here
```

For persistent configuration, add this export statement to your shell profile (.bashrc, .zshrc, etc.).

### Build

Compile the TypeScript source to JavaScript:

```bash
npm run build
```

This command:
1. Compiles TypeScript files from `src/` to `build/`
2. Makes the output executable via chmod
3. Prepares the server for execution

### Verification

Test the server using the MCP inspector:

```bash
npm run inspector
```

The inspector provides an interactive interface for testing tool functionality and validating server responses.

### Development

For active development with automatic recompilation on file changes:

```bash
npm run watch
```

## Project Context
  
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


## References

- [Kagi API Documentation](https://help.kagi.com/kagi/api/overview.html)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [kagi-api NPM Package](https://www.npmjs.com/package/kagi-api)