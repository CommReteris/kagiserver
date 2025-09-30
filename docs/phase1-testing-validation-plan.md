# Phase 1: Testing and Validation Plan

## Overview

This document provides comprehensive testing procedures and validation criteria for Phase 1 implementation of the Kagi MCP Extension Project.

## Pre-Implementation Checklist

### Environment Setup
- [ ] Verify KagiClient is imported from 'kagi-api' package
- [ ] Verify KAGI_API_KEY environment variable is set
- [ ] Verify TypeScript is configured correctly
- [ ] Verify MCP SDK version is compatible
- [ ] Verify Node.js version is compatible (≥18)

### Code Review Before Testing
- [ ] All three tool definitions added to ListToolsRequestSchema
- [ ] All three case handlers added to CallToolRequestSchema
- [ ] Version updated to 0.2.0 in both package.json and index.ts
- [ ] No TypeScript compilation errors (`npm run build`)
- [ ] Code follows existing style patterns

## Unit Testing Strategy

### Test 1: kagi_summarize Tool Definition

**Objective**: Verify tool appears in tool list with correct schema

**Test Procedure**:
```bash
npx @modelcontextprotocol/inspector kagiserver
```

**Expected Output**:
```json
{
  "tools": [
    {
      "name": "kagi_search",
      ...
    },
    {
      "name": "kagi_summarize",
      "description": "Summarize web pages or text content using Kagi's summarization engine",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": { "type": "string", ... },
          "text": { "type": "string", ... },
          "engine": { "type": "string", "enum": ["cecil", "agnes", "daphne", "muriel"], "default": "cecil" },
          "summary_type": { "type": "string", "enum": ["summary", "takeaway"], "default": "summary" },
          "target_language": { "type": "string" },
          "cache": { "type": "boolean", "default": true }
        },
        "oneOf": [
          {"required": ["url"]},
          {"required": ["text"]}
        ]
      }
    },
    ...
  ]
}
```

**Validation Criteria**:
- ✅ Tool name is exactly "kagi_summarize"
- ✅ Description is present and descriptive
- ✅ All 6 properties are defined
- ✅ Enums are correct (engines and summary types)
- ✅ Defaults are specified where appropriate
- ✅ oneOf constraint is present
- ✅ No required array at top level (handled by oneOf)

---

### Test 2: kagi_fastgpt Tool Definition

**Objective**: Verify tool appears in tool list with correct schema

**Expected Output**:
```json
{
  "name": "kagi_fastgpt",
  "description": "Get AI-generated answers with cited references using Kagi's FastGPT",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Question or query for FastGPT" },
      "cache": { "type": "boolean", "default": true }
    },
    "required": ["query"]
  }
}
```

**Validation Criteria**:
- ✅ Tool name is exactly "kagi_fastgpt"
- ✅ Description mentions AI-generated answers and citations
- ✅ Query property is required
- ✅ Cache property has default value true

---

### Test 3: kagi_enrich Tool Definition

**Objective**: Verify tool appears in tool list with correct schema

**Expected Output**:
```json
{
  "name": "kagi_enrich",
  "description": "Get enhanced search results from Kagi's curated indexes",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query for enriched results" }
    },
    "required": ["query"]
  }
}
```

**Validation Criteria**:
- ✅ Tool name is exactly "kagi_enrich"
- ✅ Description mentions enhanced results and curated indexes
- ✅ Query property is required
- ✅ No optional parameters

---

### Test 4: kagi_summarize - Valid URL Input

**Objective**: Verify tool executes correctly with URL parameter

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence"
  }
}
```

**Expected Behavior**:
1. No validation errors
2. Defaults applied: engine="cecil", summary_type="summary", cache=true
3. API called successfully
4. Response formatted as MCP content

**Validation Criteria**:
- ✅ No errors thrown
- ✅ Response has `content` array
- ✅ Content item has `type: "text"`
- ✅ Text contains valid JSON
- ✅ JSON includes summary data

---

### Test 5: kagi_summarize - Valid Text Input

**Objective**: Verify tool executes correctly with text parameter

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "text": "Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems."
  }
}
```

**Expected Behavior**:
Same as Test 4, but using text parameter instead of URL

**Validation Criteria**:
- ✅ No errors thrown
- ✅ Response properly formatted
- ✅ Summary generated from provided text

---

### Test 6: kagi_summarize - Both URL and Text (Error Case)

**Objective**: Verify mutual exclusivity validation

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://example.com",
    "text": "Some text"
  }
}
```

**Expected Behavior**:
Error thrown with message: "Only one of url or text should be provided"

**Validation Criteria**:
- ✅ Error is thrown (not success)
- ✅ Error message is descriptive
- ✅ Error message matches expected text
- ✅ API is not called

---

### Test 7: kagi_summarize - Neither URL nor Text (Error Case)

**Objective**: Verify required parameter validation

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {}
}
```

**Expected Behavior**:
Error thrown with message: "Either url or text is required"

**Validation Criteria**:
- ✅ Error is thrown
- ✅ Error message is descriptive
- ✅ API is not called

---

### Test 8: kagi_summarize - Custom Engine

**Objective**: Verify engine parameter works

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://example.com",
    "engine": "agnes"
  }
}
```

**Expected Behavior**:
- Engine "agnes" is passed to API
- Summary generated using specified engine

**Validation Criteria**:
- ✅ No errors
- ✅ Response received
- ✅ API called with correct engine parameter

---

### Test 9: kagi_summarize - Custom Summary Type

**Objective**: Verify summary_type parameter works

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://example.com",
    "summary_type": "takeaway"
  }
}
```

**Expected Behavior**:
- Summary type "takeaway" is passed to API
- Takeaway-style summary generated

**Validation Criteria**:
- ✅ No errors
- ✅ Response received
- ✅ API called with correct summary_type

---

### Test 10: kagi_summarize - Target Language

**Objective**: Verify target_language parameter works

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://example.com",
    "target_language": "es"
  }
}
```

**Expected Behavior**:
- Target language "es" is passed to API
- Summary generated in Spanish

**Validation Criteria**:
- ✅ No errors
- ✅ Response received
- ✅ Summary in target language (if API supports)

---

### Test 11: kagi_summarize - Cache False

**Objective**: Verify cache parameter works

**Test Input**:
```json
{
  "name": "kagi_summarize",
  "arguments": {
    "url": "https://example.com",
    "cache": false
  }
}
```

**Expected Behavior**:
- Cache parameter set to false
- Fresh API call made (not cached)

**Validation Criteria**:
- ✅ No errors
- ✅ Response received
- ✅ API called with cache=false

---

### Test 12: kagi_fastgpt - Valid Query

**Objective**: Verify basic FastGPT functionality

**Test Input**:
```json
{
  "name": "kagi_fastgpt",
  "arguments": {
    "query": "What is the capital of France?"
  }
}
```

**Expected Behavior**:
1. Query parameter validated
2. Default cache=true applied
3. API called successfully
4. Response contains answer with references

**Validation Criteria**:
- ✅ No errors thrown
- ✅ Response properly formatted
- ✅ Answer field present in response
- ✅ References field present (if available)

---

### Test 13: kagi_fastgpt - Missing Query (Error Case)

**Objective**: Verify required parameter validation

**Test Input**:
```json
{
  "name": "kagi_fastgpt",
  "arguments": {}
}
```

**Expected Behavior**:
Error thrown with message: "Query is required"

**Validation Criteria**:
- ✅ Error is thrown
- ✅ Error message matches expected
- ✅ API is not called

---

### Test 14: kagi_fastgpt - Cache False

**Objective**: Verify cache parameter works

**Test Input**:
```json
{
  "name": "kagi_fastgpt",
  "arguments": {
    "query": "What is quantum computing?",
    "cache": false
  }
}
```

**Expected Behavior**:
- Cache set to false
- Fresh API call made

**Validation Criteria**:
- ✅ No errors
- ✅ Response received
- ✅ API called with cache=false

---

### Test 15: kagi_enrich - Valid Query

**Objective**: Verify basic enrich functionality

**Test Input**:
```json
{
  "name": "kagi_enrich",
  "arguments": {
    "query": "machine learning"
  }
}
```

**Expected Behavior**:
1. Query parameter validated
2. API called successfully
3. Response contains enriched results

**Validation Criteria**:
- ✅ No errors thrown
- ✅ Response properly formatted
- ✅ Enhanced results present

---

### Test 16: kagi_enrich - Missing Query (Error Case)

**Objective**: Verify required parameter validation

**Test Input**:
```json
{
  "name": "kagi_enrich",
  "arguments": {}
}
```

**Expected Behavior**:
Error thrown with message: "Query is required"

**Validation Criteria**:
- ✅ Error is thrown
- ✅ Error message matches expected
- ✅ API is not called

---

## Integration Testing

### Test Suite 1: All Tools Discovery

**Objective**: Verify all 4 tools are discoverable

**Test Procedure**:
1. Start MCP inspector
2. List all tools
3. Count tools

**Expected Result**:
- Total of 4 tools listed
- kagi_search (existing)
- kagi_summarize (new)
- kagi_fastgpt (new)
- kagi_enrich (new)

---

### Test Suite 2: Sequential Tool Execution

**Objective**: Verify all tools can be executed in sequence without interference

**Test Procedure**:
1. Execute kagi_search
2. Execute kagi_summarize
3. Execute kagi_fastgpt
4. Execute kagi_enrich

**Expected Result**:
- All tools execute successfully
- No state pollution between calls
- Each returns appropriate response

---

### Test Suite 3: Error Recovery

**Objective**: Verify system recovers from errors

**Test Procedure**:
1. Execute tool with invalid parameters (causes error)
2. Execute same tool with valid parameters
3. Execute different tool

**Expected Result**:
- First call fails with error
- Second call succeeds
- Third call succeeds
- No lingering error state

---

## Performance Testing

### Metric Collection

**Metrics to Track**:
1. Response time for each tool
2. Memory usage during operation
3. API call latency
4. Error rate

**Baseline Expectations**:
- kagi_search: < 2 seconds
- kagi_summarize: < 5 seconds
- kagi_fastgpt: < 3 seconds
- kagi_enrich: < 3 seconds

---

## Code Quality Validation

### TypeScript Compilation

```bash
cd /home/rengo/.local/share/Roo-Code/MCP/kagiserver
npm run build
```

**Expected Result**:
- No compilation errors
- No TypeScript warnings
- Build completes successfully

---

### Linting (if configured)

```bash
npm run lint
```

**Expected Result**:
- No linting errors
- Code follows project style guide

---

### Code Review Checklist

#### Type Safety
- [ ] All parameters have proper type assertions
- [ ] Optional parameters use ternary operators
- [ ] Error objects are properly typed
- [ ] No `any` types used

#### Error Handling
- [ ] All required parameters validated
- [ ] All API calls wrapped in try-catch
- [ ] Error messages are descriptive
- [ ] Errors include context

#### Response Formatting
- [ ] All responses have `content` array
- [ ] Content items have `type: "text"`
- [ ] JSON is properly formatted (2-space indent)
- [ ] No response modification (raw API data)

#### Code Style
- [ ] Consistent indentation
- [ ] Consistent naming conventions
- [ ] Comments where appropriate
- [ ] No console.log (only console.error)

---

## Acceptance Testing

### Acceptance Criteria

1. **Tool Discovery**
   - ✅ All 4 tools appear in tool list
   - ✅ Each tool has complete schema
   - ✅ Schemas match specifications

2. **Tool Execution**
   - ✅ All tools execute with valid parameters
   - ✅ All tools return properly formatted responses
   - ✅ All API methods are called correctly

3. **Validation**
   - ✅ Required parameters are enforced
   - ✅ Mutual exclusivity works (summarize)
   - ✅ Defaults are applied correctly

4. **Error Handling**
   - ✅ Invalid inputs cause appropriate errors
   - ✅ API errors are caught and wrapped
   - ✅ Error messages are helpful

5. **Code Quality**
   - ✅ No TypeScript errors
   - ✅ Follows existing code patterns
   - ✅ Properly documented

---

## Test Results Template

### Test Execution Log

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | kagi_summarize definition | ⬜ PENDING | |
| 2 | kagi_fastgpt definition | ⬜ PENDING | |
| 3 | kagi_enrich definition | ⬜ PENDING | |
| 4 | kagi_summarize URL | ⬜ PENDING | |
| 5 | kagi_summarize text | ⬜ PENDING | |
| 6 | kagi_summarize both (error) | ⬜ PENDING | |
| 7 | kagi_summarize neither (error) | ⬜ PENDING | |
| 8 | kagi_summarize custom engine | ⬜ PENDING | |
| 9 | kagi_summarize takeaway | ⬜ PENDING | |
| 10 | kagi_summarize target lang | ⬜ PENDING | |
| 11 | kagi_summarize cache false | ⬜ PENDING | |
| 12 | kagi_fastgpt valid | ⬜ PENDING | |
| 13 | kagi_fastgpt no query (error) | ⬜ PENDING | |
| 14 | kagi_fastgpt cache false | ⬜ PENDING | |
| 15 | kagi_enrich valid | ⬜ PENDING | |
| 16 | kagi_enrich no query (error) | ⬜ PENDING | |

**Legend**:
- ⬜ PENDING - Not yet tested
- ✅ PASS - Test passed
- ❌ FAIL - Test failed
- ⚠️ WARN - Test passed with warnings

---

## Debugging Guide

### Common Issues and Solutions

#### Issue: "Unknown tool" error
**Cause**: Tool not added to switch statement  
**Solution**: Verify case handler exists for tool

#### Issue: "Query is required" when query provided
**Cause**: Incorrect parameter extraction  
**Solution**: Check `request.params.arguments?.query` syntax

#### Issue: "Only one of url or text" when only one provided
**Cause**: Incorrect XOR validation logic  
**Solution**: Review boolean logic in validation

#### Issue: API call fails with authentication error
**Cause**: KAGI_API_KEY not set  
**Solution**: Set environment variable

#### Issue: TypeScript compilation errors
**Cause**: Type mismatches  
**Solution**: Review type assertions and casts

---

## Sign-Off Checklist

Before marking Phase 1 complete:

- [ ] All 16 unit tests passed
- [ ] All 3 integration test suites passed
- [ ] TypeScript compiles without errors
- [ ] Code review completed
- [ ] Version updated to 0.2.0
- [ ] Documentation updated
- [ ] Performance metrics within acceptable range
- [ ] No known bugs or issues

---

## Next Steps After Phase 1

Once Phase 1 testing is complete:

1. **Phase 2**: Update Dockerfile
2. **Phase 3**: Build and push container image
3. **Phase 4**: Create Kubernetes manifests
4. **Phase 5**: Deploy with FluxCD
5. **Phase 6**: Integration testing in cluster

---

## Test Data Repository

### Sample URLs for Testing
- Wikipedia AI: https://en.wikipedia.org/wiki/Artificial_intelligence
- GitHub README: https://github.com/pytorch/pytorch/blob/main/README.md
- News article: https://news.ycombinator.com

### Sample Text for Testing
```
Artificial intelligence (AI) is intelligence demonstrated by machines, 
in contrast to the natural intelligence displayed by humans and animals. 
Leading AI textbooks define the field as the study of "intelligent agents": 
any device that perceives its environment and takes actions that maximize 
its chance of successfully achieving its goals.
```

### Sample Queries for Testing
- FastGPT: "What is the difference between machine learning and deep learning?"
- Enrich: "kubernetes container orchestration"
- Search: "best practices for REST API design"

---

## Conclusion

This testing and validation plan ensures comprehensive coverage of all new functionality in Phase 1. Following this plan will verify that the implementation meets all requirements and is ready for containerization and deployment in subsequent phases.