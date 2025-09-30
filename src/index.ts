#!/usr/bin/env node

/**
 * Kagi MCP Server
 *
 * This Model Context Protocol (MCP) server provides integration with Kagi's search,
 * summarization, FastGPT, and enrichment APIs. The server exposes these capabilities
 * as MCP tools that can be consumed by LLM applications.
 *
 * @module kagiserver
 * @version 0.2.0
 *
 * @description
 * The server implements the following tools:
 * - kagi_search: Perform web searches using Kagi's search engine
 * - kagi_summarize: Generate summaries of web pages or text content
 * - kagi_fastgpt: Get AI-generated answers with cited references
 * - kagi_enrich: Retrieve enhanced search results from curated indexes
 * - health_check: Verify server operational status and retrieve server information
 *
 * @requires @modelcontextprotocol/sdk
 * @requires kagi-api
 *
 * @example
 * // Running the server
 * // The server uses stdio transport for communication and is typically invoked
 * // by an MCP client application rather than run directly.
 *
 * @author Kagi MCP Server Implementation
 * @license MIT
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { KagiClient } from 'kagi-api';

/**
 * KagiAPI client instance
 *
 * @constant {KagiClient}
 * @description
 * Singleton instance of the KagiClient used for all Kagi API interactions.
 * The client automatically retrieves the API key from the KAGI_API_KEY environment variable.
 *
 * @throws {Error} Will fail at runtime if KAGI_API_KEY environment variable is not set
 *
 * @see {@link https://help.kagi.com/kagi/api/overview.html|Kagi API Documentation}
 */
const kagi = new KagiClient();

/**
 * MCP Server instance
 *
 * @constant {Server}
 * @description
 * Creates and configures an MCP server instance with tool capabilities.
 * The server exposes Kagi API functionality through standardized MCP tools
 * that can be invoked by compatible MCP clients.
 *
 * Server Configuration:
 * - Name: kagiserver
 * - Version: 0.2.0
 * - Capabilities: tools (search, summarize, fastgpt, enrich)
 *
 * @property {Object} info - Server metadata
 * @property {string} info.name - Server identifier
 * @property {string} info.version - Server version following semver
 * @property {Object} capabilities - Declared server capabilities
 * @property {Object} capabilities.resources - Resource capabilities (currently empty)
 * @property {Object} capabilities.tools - Tool capabilities (Kagi operations)
 */
const server = new Server(
  {
    name: "kagiserver",
    version: "0.2.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List Tools Request Handler
 *
 * @async
 * @function
 * @description
 * Handles MCP ListTools requests by returning the complete list of available tools.
 * This handler is called when an MCP client requests tool discovery.
 *
 * Available Tools:
 * 1. kagi_search - Perform web searches with configurable result limits
 * 2. kagi_summarize - Summarize web pages or text using various engines
 * 3. kagi_fastgpt - Get AI-generated answers with source citations
 * 4. kagi_enrich - Retrieve enhanced results from curated indexes
 * 5. health_check - Verify server operational status and retrieve server information
 *
 * @returns {Promise<Object>} Tool list response
 * @returns {Array<Object>} return.tools - Array of tool definitions
 * @returns {string} return.tools[].name - Tool identifier
 * @returns {string} return.tools[].description - Tool description
 * @returns {Object} return.tools[].inputSchema - JSON Schema for tool parameters
 *
 * @example
 * // Response structure
 * {
 *   tools: [
 *     {
 *       name: "kagi_search",
 *       description: "Perform a search using the Kagi search engine",
 *       inputSchema: { ... }
 *     },
 *     ...
 *   ]
 * }
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/|MCP Tools Specification}
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "kagi_search",
        description: "Perform a search using the Kagi search engine",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query"
            },
            limit: {
              type: "number",
              description: "Number of results to return (max 10)",
              minimum: 1,
              maximum: 10
            }
          },
          required: ["query"]
        }
      },
      {
        name: "kagi_summarize",
        description: "Summarize web pages or text content using Kagi's summarization engine",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL of the web page to summarize"
            },
            text: {
              type: "string",
              description: "Text content to summarize (alternative to URL)"
            },
            engine: {
              type: "string",
              enum: ["cecil", "agnes", "daphne", "muriel"],
              default: "cecil",
              description: "Summarization engine to use"
            },
            summary_type: {
              type: "string",
              enum: ["summary", "takeaway"],
              default: "summary",
              description: "Type of summary to generate"
            },
            target_language: {
              type: "string",
              description: "Target language for the summary (optional)"
            },
            cache: {
              type: "boolean",
              default: true,
              description: "Whether to use cached results"
            }
          },
          oneOf: [
            { required: ["url"] },
            { required: ["text"] }
          ]
        }
      },
      {
        name: "kagi_fastgpt",
        description: "Get AI-generated answers with cited references using Kagi's FastGPT",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Question or query for FastGPT"
            },
            cache: {
              type: "boolean",
              default: true,
              description: "Whether to use cached results"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "kagi_enrich",
        description: "Get enhanced search results from Kagi's curated indexes",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for enriched results"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "health_check",
        description: "Verify server operational status and retrieve server information",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  };
});

/**
 * Call Tool Request Handler
 *
 * @async
 * @function
 * @description
 * Handles MCP CallTool requests by executing the requested Kagi API operation.
 * This handler processes tool invocations and returns results in MCP-compliant format.
 *
 * Supported Tools:
 * - kagi_search: Web search with result limiting
 * - kagi_summarize: Content summarization with engine selection
 * - kagi_fastgpt: AI-powered question answering
 * - kagi_enrich: Enhanced search results retrieval
 * - health_check: Server health status verification
 *
 * @param {Object} request - MCP tool call request
 * @param {Object} request.params - Request parameters
 * @param {string} request.params.name - Name of the tool to execute
 * @param {Object} request.params.arguments - Tool-specific arguments
 *
 * @returns {Promise<Object>} Tool execution response
 * @returns {Array<Object>} return.content - Response content array
 * @returns {string} return.content[].type - Content type (always "text")
 * @returns {string} return.content[].text - JSON-formatted result data
 *
 * @throws {Error} If required parameters are missing or invalid
 * @throws {Error} If the Kagi API request fails
 * @throws {Error} If an unknown tool name is specified
 *
 * @example
 * // Search request
 * {
 *   params: {
 *     name: "kagi_search",
 *     arguments: {
 *       query: "machine learning",
 *       limit: 5
 *     }
 *   }
 * }
 *
 * @example
 * // Summarize request
 * {
 *   params: {
 *     name: "kagi_summarize",
 *     arguments: {
 *       url: "https://example.com/article",
 *       engine: "cecil",
 *       summary_type: "summary"
 *     }
 *   }
 * }
 *
 * @see {@link https://help.kagi.com/kagi/api/overview.html|Kagi API Documentation}
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    /**
     * Kagi Search Tool Handler
     *
     * @description
     * Executes web searches using the Kagi search engine API.
     * Returns up to 10 search results with titles, URLs, and snippets.
     *
     * @param {string} query - Search query string (required)
     * @param {number} [limit=5] - Maximum number of results (1-10)
     *
     * @returns {Promise<Object>} Search results
     * @returns {Array<Object>} return.results - Array of search result objects
     * @returns {string} return.results[].title - Result title
     * @returns {string} return.results[].url - Result URL
     * @returns {string} return.results[].snippet - Result description snippet
     *
     * @throws {Error} "Query is required" - If query parameter is missing
     * @throws {Error} "Search failed: {message}" - If Kagi API request fails
     *
     * @example
     * // Input
     * { query: "best practices typescript", limit: 3 }
     *
     * // Output
     * {
     *   results: [
     *     {
     *       title: "TypeScript Best Practices",
     *       url: "https://example.com/ts-best-practices",
     *       snippet: "A comprehensive guide to TypeScript..."
     *     }
     *   ]
     * }
     */
    case "kagi_search": {
      const query = String(request.params.arguments?.query);
      const limit = Math.min(Number(request.params.arguments?.limit || 5), 10);

      if (!query) {
        throw new Error("Query is required");
      }

      try {
        /**
         * Execute Kagi search API call
         * The limit is capped at 10 to comply with API constraints
         */
        const results = await kagi.search(query, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
          }]
        };
      } catch (error) {
        console.error("KagiAPI error:", error);
        throw new Error(`Search failed: ${(error as Error).message}`);
      }
    }

    /**
     * Kagi Summarize Tool Handler
     *
     * @description
     * Generates summaries of web pages or text content using Kagi's summarization engines.
     * Supports multiple engine types with different summarization characteristics.
     *
     * Input (mutually exclusive):
     * @param {string} [url] - URL of web page to summarize
     * @param {string} [text] - Text content to summarize
     *
     * Options:
     * @param {("cecil"|"agnes"|"daphne"|"muriel")} [engine="cecil"] - Summarization engine
     *   - cecil: Formal, technical summaries
     *   - agnes: Casual, narrative summaries
     *   - daphne: Bullet-point summaries
     *   - muriel: Detailed, comprehensive summaries
     * @param {("summary"|"takeaway")} [summary_type="summary"] - Summary format type
     * @param {string} [target_language] - ISO language code for summary output
     * @param {boolean} [cache=true] - Whether to use cached results for faster response
     *
     * @returns {Promise<Object>} Summarization result
     * @returns {string} return.summary - Generated summary text
     * @returns {Object} return.metadata - Summary metadata
     *
     * @throws {Error} "Either url or text is required" - If neither parameter provided
     * @throws {Error} "Only one of url or text should be provided" - If both parameters provided
     * @throws {Error} "Summarization failed: {message}" - If Kagi API request fails
     *
     * @example
     * // URL-based summarization
     * {
     *   url: "https://example.com/long-article",
     *   engine: "cecil",
     *   summary_type: "summary"
     * }
     *
     * @example
     * // Text-based summarization
     * {
     *   text: "Long article text...",
     *   engine: "daphne",
     *   summary_type: "takeaway",
     *   target_language: "es"
     * }
     */
    case "kagi_summarize": {
      const url = request.params.arguments?.url ? String(request.params.arguments.url) : undefined;
      const text = request.params.arguments?.text ? String(request.params.arguments.text) : undefined;

      /**
       * Validate mutual exclusivity of url and text parameters
       * Exactly one must be provided, but not both
       */
      if (!url && !text) {
        throw new Error("Either url or text is required");
      }
      if (url && text) {
        throw new Error("Only one of url or text should be provided");
      }

      /**
       * Extract optional parameters with type-safe defaults
       * All parameters have fallback values matching Kagi API expectations
       */
      const engine = String(request.params.arguments?.engine || "cecil") as "cecil" | "agnes" | "daphne" | "muriel";
      const summary_type = String(request.params.arguments?.summary_type || "summary") as "summary" | "takeaway";
      const target_language = request.params.arguments?.target_language
        ? String(request.params.arguments.target_language)
        : undefined;
      const cache = request.params.arguments?.cache !== undefined
        ? Boolean(request.params.arguments.cache)
        : true;

      try {
        /**
         * Execute Kagi summarize API call
         * Supports both URL-based and text-based summarization
         */
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

    /**
     * Kagi FastGPT Tool Handler
     *
     * @description
     * Provides AI-generated answers to questions using Kagi's FastGPT service.
     * Returns comprehensive answers with citations to source material.
     *
     * @param {string} query - Question or query for FastGPT (required)
     * @param {boolean} [cache=true] - Whether to use cached results for faster response
     *
     * @returns {Promise<Object>} FastGPT response
     * @returns {string} return.answer - AI-generated answer text
     * @returns {Array<Object>} return.references - Source references and citations
     * @returns {string} return.references[].title - Reference title
     * @returns {string} return.references[].url - Reference URL
     * @returns {string} return.references[].snippet - Relevant excerpt
     *
     * @throws {Error} "Query is required" - If query parameter is missing
     * @throws {Error} "FastGPT query failed: {message}" - If Kagi API request fails
     *
     * @example
     * // Input
     * {
     *   query: "What are the benefits of functional programming?",
     *   cache: true
     * }
     *
     * // Output
     * {
     *   answer: "Functional programming offers several key benefits...",
     *   references: [
     *     {
     *       title: "Functional Programming Principles",
     *       url: "https://example.com/fp-guide",
     *       snippet: "The main advantages include..."
     *     }
     *   ]
     * }
     */
    case "kagi_fastgpt": {
      const query = String(request.params.arguments?.query);

      if (!query) {
        throw new Error("Query is required");
      }

      const cache = request.params.arguments?.cache !== undefined
        ? Boolean(request.params.arguments.cache)
        : true;

      try {
        /**
         * Execute Kagi FastGPT API call
         * Returns AI-generated answers with source citations
         */
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

    /**
     * Kagi Enrich Tool Handler
     *
     * @description
     * Retrieves enhanced search results from Kagi's curated knowledge indexes.
     * Provides higher-quality, more relevant results from vetted sources.
     *
     * @param {string} query - Search query for enriched results (required)
     *
     * @returns {Promise<Object>} Enriched search results
     * @returns {Array<Object>} return.results - Array of enriched result objects
     * @returns {string} return.results[].title - Result title
     * @returns {string} return.results[].url - Result URL
     * @returns {string} return.results[].snippet - Enhanced description
     * @returns {Object} return.results[].metadata - Additional enrichment data
     *
     * @throws {Error} "Query is required" - If query parameter is missing
     * @throws {Error} "Enrich query failed: {message}" - If Kagi API request fails
     *
     * @example
     * // Input
     * { query: "climate change solutions" }
     *
     * // Output
     * {
     *   results: [
     *     {
     *       title: "IPCC Climate Solutions Report",
     *       url: "https://example.com/ipcc-report",
     *       snippet: "Comprehensive analysis of mitigation strategies...",
     *       metadata: { source_type: "research_paper", credibility: "high" }
     *     }
     *   ]
     * }
     */
    case "kagi_enrich": {
      const query = String(request.params.arguments?.query);

      if (!query) {
        throw new Error("Query is required");
      }

      try {
        /**
         * Execute Kagi enrich API call
         * Returns enhanced results from curated knowledge sources
         */
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

    /**
     * Health Check Tool Handler
     *
     * @description
     * Provides server health status and operational information without making external API calls.
     * This tool allows MCP clients to verify server availability and retrieve server metadata.
     *
     * @returns {Promise<Object>} Health check result
     * @returns {string} return.status - Server health status (always "healthy" if responding)
     * @returns {string} return.server_name - Server identifier
     * @returns {string} return.server_version - Server version following semver
     * @returns {string} return.timestamp - Current ISO 8601 UTC timestamp
     * @returns {number} return.available_tools_count - Number of available tools
     * @returns {Array<string>} return.available_tools - List of available tool names
     *
     * @example
     * // Output
     * {
     *   status: "healthy",
     *   server_name: "kagiserver",
     *   server_version: "0.2.0",
     *   timestamp: "2025-09-30T07:12:36.713Z",
     *   available_tools_count: 5,
     *   available_tools: ["kagi_search", "kagi_summarize", "kagi_fastgpt", "kagi_enrich", "health_check"]
     * }
     */
    case "health_check": {
      /**
       * Define list of available tools for health check reporting
       * This must be kept in sync with the tools array in ListToolsRequestSchema
       */
      const availableTools = [
        "kagi_search",
        "kagi_summarize",
        "kagi_fastgpt",
        "kagi_enrich",
        "health_check"
      ];

      const healthCheckResult = {
        status: "healthy",
        server_name: "kagiserver",
        server_version: "0.2.0",
        timestamp: new Date().toISOString(),
        available_tools_count: availableTools.length,
        available_tools: availableTools
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(healthCheckResult, null, 2)
        }]
      };
    }

    /**
     * Handle unknown tool invocation
     *
     * @throws {Error} "Unknown tool" - If tool name doesn't match any supported tools
     */
    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Server Initialization and Startup
 *
 * @async
 * @function main
 * @description
 * Initializes and starts the MCP server using stdio (standard input/output) transport.
 * The server communicates with MCP clients through stdin/stdout, making it suitable
 * for process-based integration.
 *
 * Transport Configuration:
 * - Uses StdioServerTransport for communication
 * - Reads requests from stdin
 * - Writes responses to stdout
 * - Logs errors to stderr
 *
 * @returns {Promise<void>} Resolves when server is successfully connected
 *
 * @throws {Error} Any connection or initialization errors are caught and logged
 *
 * @example
 * // The server is typically started by an MCP client
 * // Example client configuration (e.g., for Claude Desktop):
 * {
 *   "mcpServers": {
 *     "kagi": {
 *       "command": "node",
 *       "args": ["/path/to/kagiserver/dist/index.js"],
 *       "env": {
 *         "KAGI_API_KEY": "your-api-key-here"
 *       }
 *     }
 *   }
 * }
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/transports/|MCP Transport Specification}
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Global error handler for server startup
 *
 * @description
 * Catches any unhandled errors during server initialization and ensures
 * proper error logging and process termination.
 *
 * @param {Error} error - The error that occurred during startup
 *
 * @exitcode 1 - Indicates server startup failure
 */
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});