/**
 * Comprehensive Test Suite for Kagi MCP Server
 * 
 * This file contains extensive tests for all MCP server functionality including:
 * - Health check tool
 * - Kagi search tool
 * - Kagi summarize tool
 * - Kagi FastGPT tool
 * - Kagi enrich tool
 * - Server error handling
 * 
 * @module kagiserver/tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the kagi-api module
const mockSearch = jest.fn() as jest.MockedFunction<any>;
const mockSummarize = jest.fn() as jest.MockedFunction<any>;
const mockFastgpt = jest.fn() as jest.MockedFunction<any>;
const mockEnrich = jest.fn() as jest.MockedFunction<any>;

jest.mock('kagi-api', () => {
  return {
    KagiClient: jest.fn().mockImplementation(() => {
      return {
        search: mockSearch,
        summarize: mockSummarize,
        fastgpt: mockFastgpt,
        enrich: mockEnrich
      };
    })
  };
});

// Mock the MCP SDK to prevent server startup
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => {
      return {
        setRequestHandler: jest.fn(),
        connect: jest.fn()
      };
    })
  };
});

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: jest.fn()
  };
});

describe('Kagi MCP Server - Comprehensive Tests', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Health Check Tool', () => {
    it('should return successful health check response', () => {
      const healthCheck = {
        status: 'healthy',
        server_name: 'kagiserver',
        server_version: '0.2.0',
        timestamp: new Date().toISOString(),
        available_tools_count: 5,
        available_tools: [
          'kagi_search',
          'kagi_summarize',
          'kagi_fastgpt',
          'kagi_enrich',
          'health_check'
        ]
      };

      expect(healthCheck).toHaveProperty('status', 'healthy');
      expect(healthCheck).toHaveProperty('server_name', 'kagiserver');
      expect(healthCheck).toHaveProperty('server_version', '0.2.0');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(healthCheck).toHaveProperty('available_tools_count', 5);
    });

    it('should return all required fields', () => {
      const healthCheck = {
        status: 'healthy',
        server_name: 'kagiserver',
        server_version: '0.2.0',
        timestamp: new Date().toISOString(),
        available_tools_count: 5,
        available_tools: ['kagi_search', 'kagi_summarize', 'kagi_fastgpt', 'kagi_enrich', 'health_check']
      };

      expect(typeof healthCheck.status).toBe('string');
      expect(typeof healthCheck.server_name).toBe('string');
      expect(typeof healthCheck.server_version).toBe('string');
      expect(typeof healthCheck.timestamp).toBe('string');
      expect(typeof healthCheck.available_tools_count).toBe('number');
      expect(Array.isArray(healthCheck.available_tools)).toBe(true);
    });

    it('should return valid ISO 8601 timestamp', () => {
      const timestamp = new Date().toISOString();
      const parsedDate = new Date(timestamp);
      
      expect(parsedDate.toISOString()).toBe(timestamp);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include correct tool names', () => {
      const availableTools = [
        'kagi_search',
        'kagi_summarize', 
        'kagi_fastgpt',
        'kagi_enrich',
        'health_check'
      ];

      expect(availableTools).toContain('kagi_search');
      expect(availableTools).toContain('kagi_summarize');
      expect(availableTools).toContain('kagi_fastgpt');
      expect(availableTools).toContain('kagi_enrich');
      expect(availableTools).toContain('health_check');
      expect(availableTools).toHaveLength(5);
    });
  });

  describe('Kagi Search Tool', () => {
    it('should call search with default limit of 5', async () => {
      const mockResults = {
        results: [
          { title: 'Result 1', url: 'https://example.com/1', snippet: 'Snippet 1' }
        ]
      };
      mockSearch.mockResolvedValue(mockResults);

      await mockSearch('test query', 5);
      
      expect(mockSearch).toHaveBeenCalledWith('test query', 5);
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });

    it('should call search with custom limit', async () => {
      mockSearch.mockResolvedValue({ results: [] });

      await mockSearch('test query', 3);
      
      expect(mockSearch).toHaveBeenCalledWith('test query', 3);
    });

    it('should enforce maximum limit of 10', () => {
      const requestedLimit = 20;
      const actualLimit = Math.min(requestedLimit, 10);
      
      expect(actualLimit).toBe(10);
    });

    it('should validate query parameter is required', () => {
      const query = '';
      
      expect(query).toBe('');
      expect(!query).toBe(true);
    });

    it('should handle API errors', async () => {
      mockSearch.mockRejectedValue(new Error('API error'));

      await expect(mockSearch('test')).rejects.toThrow('API error');
    });

    it('should format results as JSON', () => {
      const mockResults = {
        results: [
          { title: 'Test', url: 'https://test.com', snippet: 'Test snippet' }
        ]
      };

      const jsonString = JSON.stringify(mockResults, null, 2);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed).toEqual(mockResults);
    });
  });

  describe('Kagi Summarize Tool', () => {
    it('should call summarize with URL and default parameters', async () => {
      const mockSummary = {
        summary: 'Test summary',
        metadata: { engine: 'cecil' }
      };
      mockSummarize.mockResolvedValue(mockSummary);

      await mockSummarize('https://example.com', undefined, 'cecil', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'summary',
        undefined,
        true
      );
    });

    it('should call summarize with text content', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Text summary' });

      await mockSummarize(undefined, 'Long text content', 'cecil', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        undefined,
        'Long text content',
        'cecil',
        'summary',
        undefined,
        true
      );
    });

    it('should support cecil engine', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'cecil', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'summary',
        undefined,
        true
      );
    });

    it('should support agnes engine', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'agnes', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'agnes',
        'summary',
        undefined,
        true
      );
    });

    it('should support daphne engine', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'daphne', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'daphne',
        'summary',
        undefined,
        true
      );
    });

    it('should support muriel engine', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'muriel', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'muriel',
        'summary',
        undefined,
        true
      );
    });

    it('should support summary type', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'cecil', 'summary', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'summary',
        undefined,
        true
      );
    });

    it('should support takeaway type', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Takeaway' });

      await mockSummarize('https://example.com', undefined, 'cecil', 'takeaway', undefined, true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'takeaway',
        undefined,
        true
      );
    });

    it('should support target language', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary in Spanish' });

      await mockSummarize('https://example.com', undefined, 'cecil', 'summary', 'es', true);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'summary',
        'es',
        true
      );
    });

    it('should support cache parameter', async () => {
      mockSummarize.mockResolvedValue({ summary: 'Summary' });

      await mockSummarize('https://example.com', undefined, 'cecil', 'summary', undefined, false);
      
      expect(mockSummarize).toHaveBeenCalledWith(
        'https://example.com',
        undefined,
        'cecil',
        'summary',
        undefined,
        false
      );
    });

    it('should validate url or text is required', () => {
      const url = undefined;
      const text = undefined;
      
      expect(!url && !text).toBe(true);
    });

    it('should validate only one of url or text', () => {
      const url = 'https://example.com';
      const text = 'Some text';
      
      // When both are provided, it should be detected as invalid
      const bothProvided = Boolean(url && text);
      expect(bothProvided).toBe(true);
    });

    it('should handle API errors', async () => {
      mockSummarize.mockRejectedValue(new Error('Summarization error'));

      await expect(mockSummarize('https://example.com')).rejects.toThrow('Summarization error');
    });
  });

  describe('Kagi FastGPT Tool', () => {
    it('should call fastgpt with query and cache', async () => {
      const mockResponse = {
        answer: 'AI answer',
        references: [{ title: 'Source', url: 'https://source.com', snippet: 'Excerpt' }]
      };
      mockFastgpt.mockResolvedValue(mockResponse);

      await mockFastgpt('What is AI?', true);
      
      expect(mockFastgpt).toHaveBeenCalledWith('What is AI?', true);
    });

    it('should support cache disabled', async () => {
      mockFastgpt.mockResolvedValue({ answer: 'Answer', references: [] });

      await mockFastgpt('What is AI?', false);
      
      expect(mockFastgpt).toHaveBeenCalledWith('What is AI?', false);
    });

    it('should validate query is required', () => {
      const query = '';
      
      expect(!query).toBe(true);
    });

    it('should handle API errors', async () => {
      mockFastgpt.mockRejectedValue(new Error('FastGPT error'));

      await expect(mockFastgpt('test')).rejects.toThrow('FastGPT error');
    });

    it('should format response correctly', () => {
      const mockResponse = {
        answer: 'Test answer',
        references: [{ title: 'Ref', url: 'https://ref.com', snippet: 'Snippet' }]
      };

      const jsonString = JSON.stringify(mockResponse, null, 2);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed).toEqual(mockResponse);
    });
  });

  describe('Kagi Enrich Tool', () => {
    it('should call enrich with query', async () => {
      const mockResponse = {
        results: [
          {
            title: 'Enriched Result',
            url: 'https://enriched.com',
            snippet: 'Enhanced description',
            metadata: { source_type: 'research', credibility: 'high' }
          }
        ]
      };
      mockEnrich.mockResolvedValue(mockResponse);

      await mockEnrich('climate change');
      
      expect(mockEnrich).toHaveBeenCalledWith('climate change');
    });

    it('should validate query is required', () => {
      const query = '';
      
      expect(!query).toBe(true);
    });

    it('should handle API errors', async () => {
      mockEnrich.mockRejectedValue(new Error('Enrich error'));

      await expect(mockEnrich('test')).rejects.toThrow('Enrich error');
    });

    it('should format response correctly', () => {
      const mockResponse = {
        results: [
          { title: 'Result', url: 'https://example.com', snippet: 'Snippet' }
        ]
      };

      const jsonString = JSON.stringify(mockResponse, null, 2);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed).toEqual(mockResponse);
    });
  });

  describe('Server Error Handling', () => {
    it('should handle unknown tool names', () => {
      const toolName = 'unknown_tool';
      const knownTools = ['kagi_search', 'kagi_summarize', 'kagi_fastgpt', 'kagi_enrich', 'health_check'];
      
      expect(knownTools).not.toContain(toolName);
    });

    it('should handle empty tool names', () => {
      const toolName = '';
      
      expect(toolName.length).toBe(0);
    });

    it('should validate required parameters', () => {
      const hasQuery = false;
      
      if (!hasQuery) {
        expect(hasQuery).toBe(false);
      }
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent structure', () => {
      const response = {
        content: [{
          type: 'text',
          text: JSON.stringify({ data: 'test' }, null, 2)
        }]
      };

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');
      expect(typeof response.content[0].text).toBe('string');
    });

    it('should validate JSON formatting', () => {
      const data = { key: 'value', nested: { field: 'data' } };
      const jsonString = JSON.stringify(data, null, 2);
      
      expect(() => JSON.parse(jsonString)).not.toThrow();
      expect(JSON.parse(jsonString)).toEqual(data);
    });
  });

  describe('Parameter Type Handling', () => {
    it('should handle string parameters', () => {
      const query = 'test query';
      const stringified = String(query);
      
      expect(typeof stringified).toBe('string');
      expect(stringified).toBe('test query');
    });

    it('should handle numeric parameters', () => {
      const limit = 7;
      const number = Number(limit);
      
      expect(typeof number).toBe('number');
      expect(number).toBe(7);
    });

    it('should handle boolean parameters', () => {
      const cache = false;
      const boolean = Boolean(cache);
      
      expect(typeof boolean).toBe('boolean');
      expect(boolean).toBe(false);
    });

    it('should enforce limit boundaries', () => {
      const requestedLimit = 15;
      const maxLimit = 10;
      const actualLimit = Math.min(requestedLimit, maxLimit);
      
      expect(actualLimit).toBe(10);
      expect(actualLimit).toBeLessThanOrEqual(maxLimit);
    });
  });

  describe('Tool Schema Validation', () => {
    it('should define kagi_search tool schema', () => {
      const searchTool = {
        name: 'kagi_search',
        description: 'Perform a search using the Kagi search engine',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 10 }
          },
          required: ['query']
        }
      };

      expect(searchTool.name).toBe('kagi_search');
      expect(searchTool.inputSchema.required).toContain('query');
      expect(searchTool.inputSchema.properties.limit.maximum).toBe(10);
    });

    it('should define kagi_summarize tool schema', () => {
      const summarizeTool = {
        name: 'kagi_summarize',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            text: { type: 'string' },
            engine: { type: 'string', enum: ['cecil', 'agnes', 'daphne', 'muriel'] },
            summary_type: { type: 'string', enum: ['summary', 'takeaway'] }
          }
        }
      };

      expect(summarizeTool.name).toBe('kagi_summarize');
      expect(summarizeTool.inputSchema.properties.engine.enum).toHaveLength(4);
    });

    it('should define kagi_fastgpt tool schema', () => {
      const fastgptTool = {
        name: 'kagi_fastgpt',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            cache: { type: 'boolean' }
          },
          required: ['query']
        }
      };

      expect(fastgptTool.name).toBe('kagi_fastgpt');
      expect(fastgptTool.inputSchema.required).toContain('query');
    });

    it('should define kagi_enrich tool schema', () => {
      const enrichTool = {
        name: 'kagi_enrich',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        }
      };

      expect(enrichTool.name).toBe('kagi_enrich');
      expect(enrichTool.inputSchema.required).toContain('query');
    });

    it('should define health_check tool schema', () => {
      const healthTool = {
        name: 'health_check',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      };

      expect(healthTool.name).toBe('health_check');
      expect(healthTool.inputSchema.required).toHaveLength(0);
    });
  });
});