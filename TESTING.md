# Testing Infrastructure Documentation

## Overview

This document describes the complete testing infrastructure setup for the Kagi MCP Server project.

## Testing Stack

The project uses the following testing technologies:

- **Jest 30.2.0**: Modern JavaScript testing framework
- **ts-jest 29.4.4**: TypeScript preprocessor for Jest with ES module support
- **@types/jest 30.0.0**: TypeScript type definitions for Jest
- **@jest/globals 30.2.0**: TypeScript-compatible Jest globals

## Project Configuration

### Jest Configuration (`jest.config.js`)

The Jest configuration is optimized for TypeScript ES modules:

- **Preset**: `ts-jest/presets/default-esm` - Enables ES module support
- **Test Environment**: `node` - Suitable for Node.js applications
- **ES Module Support**: Configured with `extensionsToTreatAsEsm` and module name mapping
- **Coverage Thresholds**: 70% minimum across all metrics (branches, functions, lines, statements)
- **Test Patterns**: Discovers `*.test.ts` and `*.spec.ts` files
- **Coverage Output**: HTML, LCOV, and text formats in `coverage/` directory

### Package.json Scripts

Three test scripts are available:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

All scripts use `NODE_OPTIONS=--experimental-vm-modules` to enable ES module support in Jest.

### TypeScript Configuration

The testing infrastructure is compatible with the project's TypeScript configuration:

- **Module**: Node16 (ES modules)
- **Module Resolution**: Node16
- **Target**: ES2022
- **Strict Mode**: Enabled

## Directory Structure

```
src/
├── __tests__/
│   ├── README.md           # Testing documentation
│   └── index.test.ts       # Sample tests and infrastructure verification
└── index.ts                # Main server code

coverage/                   # Generated coverage reports (gitignored)
jest.config.js             # Jest configuration
```

## Test File Organization

Test files follow these conventions:

- **Location**: `src/__tests__/` directory
- **Naming**: `*.test.ts` or `*.spec.ts`
- **Structure**: Organized using `describe()` blocks for logical grouping
- **Imports**: Use ES module syntax (`import` statements)

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  it('should perform expected behavior', () => {
    const result = someFunction();
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

### Mocking Functions

```typescript
import { jest } from '@jest/globals';

const mockFn = jest.fn();
(mockFn as any).mockResolvedValue('mocked value');

const result = await mockFn();
expect(result).toBe('mocked value');
```

### Mocking External Dependencies

For mocking the Kagi API client or other external dependencies:

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

## Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML Report**: `coverage/lcov-report/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI/CD integration)
- **Text Summary**: Displayed in terminal after test run

### Coverage Thresholds

The project enforces minimum coverage thresholds:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Tests will fail if coverage drops below these thresholds.

## Current Test Status

### Infrastructure Tests

The project includes 19 passing tests that verify:

- ✅ Basic test execution (synchronous and asynchronous)
- ✅ TypeScript support and type inference
- ✅ Promise handling
- ✅ Error handling for async operations
- ✅ Jest matchers (equality, objects, arrays, strings)
- ✅ Mock functions (creation, return values, async mocking)
- ✅ Test utilities (timeouts, skipping)

### Server Code Coverage

Current coverage: 0% (no server code tests yet)

The infrastructure is ready for adding server-specific tests. Example patterns are provided in `src/__tests__/index.test.ts`.

## CI/CD Integration

The testing infrastructure is CI/CD ready:

1. **Test Execution**: `npm test` runs all tests
2. **Coverage Generation**: `npm run test:coverage` generates coverage reports
3. **Exit Codes**: Non-zero exit code on test failures or coverage threshold violations
4. **LCOV Output**: Compatible with popular coverage reporting services

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on shared state
2. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
3. **AAA Pattern**: Follow Arrange-Act-Assert structure
4. **Mock External Dependencies**: Always mock API clients and external services
5. **Test Error Cases**: Include tests for error handling and edge cases
6. **Maintain Coverage**: Keep coverage above 70% for all metrics
7. **Type Safety**: Use TypeScript types in tests for better type checking

## Troubleshooting

### ES Module Issues

If you encounter ES module errors:
- Ensure `NODE_OPTIONS=--experimental-vm-modules` is set in test scripts
- Verify jest.config.js uses the ESM preset
- Check that imports use `.js` extensions where required

### Type Errors in Tests

When working with mocks, use type assertions:
```typescript
(mockFunction as any).mockResolvedValue(value);
```

### Coverage Not Collecting

Verify:
- Test files are in the correct location (`src/__tests__/`)
- Files follow naming conventions (`*.test.ts` or `*.spec.ts`)
- `collectCoverageFrom` patterns in jest.config.js match your source files

## Next Steps

To add tests for the MCP server tools:

1. Create test files for each tool (search, summarize, fastgpt, enrich)
2. Mock the KagiClient in each test file
3. Test request validation, parameter handling, and response formatting
4. Test error scenarios and edge cases
5. Verify MCP protocol compliance

See `src/__tests__/README.md` for detailed examples and patterns.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing TypeScript with Jest](https://jestjs.io/docs/getting-started#via-ts-jest)
- [MCP Specification](https://spec.modelcontextprotocol.io/)