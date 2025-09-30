# Testing Documentation

## Overview

This directory contains test files for the Kagi MCP Server. The testing infrastructure uses Jest with TypeScript support for comprehensive testing of server functionality.

## Test Structure

```
src/__tests__/
├── README.md           # This file
└── index.test.ts       # Sample tests demonstrating mocking and async testing
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test File Naming Conventions

Test files should follow these naming patterns:
- `*.test.ts` - Standard test files
- `*.spec.ts` - Specification test files

Both patterns will be automatically discovered by Jest.

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Mocking the Kagi API Client

The Kagi API client should be mocked to prevent actual API calls during testing:

```typescript
jest.mock('kagi-api', () => {
  return {
    KagiClient: jest.fn().mockImplementation(() => ({
      search: jest.fn(),
      summarize: jest.fn(),
      fastgpt: jest.fn(),
      enrich: jest.fn(),
    })),
  };
});
```

### Testing MCP Server Tools

When testing server tools, mock the request/response flow:

```typescript
const mockRequest = {
  params: {
    name: 'kagi_search',
    arguments: {
      query: 'test query',
      limit: 5
    }
  }
};

// Mock the Kagi client response
const mockResponse = {
  data: [/* search results */]
};

(kagiClient.search as jest.Mock).mockResolvedValue(mockResponse);

// Test the handler
const result = await handler(mockRequest);
expect(result.content[0].text).toContain('test');
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/coverage-final.json` - JSON coverage data
- `coverage/lcov.info` - LCOV format for CI/CD integration

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on the state from other tests
2. **Use descriptive names**: Test descriptions should clearly explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert structure for clarity
4. **Mock external dependencies**: Always mock API clients and external services
5. **Test error cases**: Include tests for error handling and edge cases
6. **Maintain coverage**: Aim for minimum 70% coverage across all metrics

## CI/CD Integration

The test configuration is compatible with CI/CD pipelines. Coverage thresholds are enforced:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Troubleshooting

### ES Modules Issues
If you encounter ES module errors, ensure:
- `NODE_OPTIONS=--experimental-vm-modules` is set in test scripts
- Jest config uses `preset: 'ts-jest/presets/default-esm'`
- `extensionsToTreatAsEsm: ['.ts']` is configured

### Type Errors
Import test utilities from `@jest/globals`:
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
```

### Mock Not Working
Ensure mocks are defined before importing the modules that use them:
```typescript
// Mock first
jest.mock('kagi-api', () => ({ /* mock implementation */ }));

// Import after
import { Server } from '@modelcontextprotocol/sdk/server/index.js';