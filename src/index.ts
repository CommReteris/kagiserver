#!/usr/bin/env node

/**
 * This is a template MCP server that implements Kagi search functionality.
 * It demonstrates how to integrate the KagiAPI library with an MCP server
 * by providing search capabilities as tools and resources.
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
 * Initialize the KagiAPI client
 */
const kagi = new KagiClient();

/**
 * Create an MCP server with capabilities for tools (Kagi search).
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
 * Handler that lists available tools.
 * Exposes Kagi search, summarize, FastGPT, and enrich functionality.
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
      }
    ]
  };
});

/**
 * Handler for all Kagi tools.
 * Performs searches, summarizations, FastGPT queries, and enriched searches.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "kagi_search": {
      const query = String(request.params.arguments?.query);
      const limit = Math.min(Number(request.params.arguments?.limit || 5), 10);

      if (!query) {
        throw new Error("Query is required");
      }

      try {
        // Perform Kagi search
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

    case "kagi_summarize": {
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
      const engine = String(request.params.arguments?.engine || "cecil") as "cecil" | "agnes" | "daphne" | "muriel";
      const summary_type = String(request.params.arguments?.summary_type || "summary") as "summary" | "takeaway";
      const target_language = request.params.arguments?.target_language
        ? String(request.params.arguments.target_language)
        : undefined;
      const cache = request.params.arguments?.cache !== undefined
        ? Boolean(request.params.arguments.cache)
        : true;

      try {
        // Perform Kagi summarization
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

    case "kagi_fastgpt": {
      const query = String(request.params.arguments?.query);

      if (!query) {
        throw new Error("Query is required");
      }

      const cache = request.params.arguments?.cache !== undefined
        ? Boolean(request.params.arguments.cache)
        : true;

      try {
        // Perform Kagi FastGPT query
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

    case "kagi_enrich": {
      const query = String(request.params.arguments?.query);

      if (!query) {
        throw new Error("Query is required");
      }

      try {
        // Perform Kagi enrich query
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

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});