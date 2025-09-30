# Phase 1 Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "MCP Server (index.ts)"
        Server[Server Instance<br/>v0.1.0 → v0.2.0]
        
        subgraph "Request Handlers"
            ListTools[ListToolsRequestSchema<br/>Handler]
            CallTool[CallToolRequestSchema<br/>Handler]
        end
        
        subgraph "Kagi API Client"
            KagiClient[KagiClient Instance]
        end
    end
    
    subgraph "Tool Definitions (4 total)"
        Search[kagi_search<br/>EXISTING]
        Summarize[kagi_summarize<br/>NEW]
        FastGPT[kagi_fastgpt<br/>NEW]
        Enrich[kagi_enrich<br/>NEW]
    end
    
    subgraph "API Methods"
        SearchAPI[search query, limit]
        SummarizeAPI[summarize url?, text?,<br/>engine?, summary_type?,<br/>target_language?, cache?]
        FastGPTAPI[fastgpt query, cache?]
        EnrichAPI[enrich query]
    end
    
    Server --> ListTools
    Server --> CallTool
    
    ListTools --> Search
    ListTools --> Summarize
    ListTools --> FastGPT
    ListTools --> Enrich
    
    CallTool --> KagiClient
    
    Search --> SearchAPI
    Summarize --> SummarizeAPI
    FastGPT --> FastGPTAPI
    Enrich --> EnrichAPI
    
    KagiClient --> SearchAPI
    KagiClient --> SummarizeAPI
    KagiClient --> FastGPTAPI
    KagiClient --> EnrichAPI
    
    style Search fill:#90EE90
    style Summarize fill:#FFB6C1
    style FastGPT fill:#FFB6C1
    style Enrich fill:#FFB6C1
    style Server fill:#87CEEB
```

## Tool Implementation Flow

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant Handler as Tool Handler
    participant Kagi as KagiClient
    participant API as Kagi API
    
    Note over Client,API: Tool Discovery Phase
    Client->>Server: ListToolsRequest
    Server->>Client: Returns 4 tools<br/>(search, summarize, fastgpt, enrich)
    
    Note over Client,API: Tool Execution Phase
    Client->>Server: CallToolRequest(kagi_summarize)
    Server->>Handler: Route to summarize case
    
    Handler->>Handler: Extract parameters
    Handler->>Handler: Validate url XOR text
    Handler->>Handler: Apply defaults<br/>(engine=cecil, etc.)
    
    alt Valid Parameters
        Handler->>Kagi: summarize(url, text, ...)
        Kagi->>API: HTTP Request
        API-->>Kagi: JSON Response
        Kagi-->>Handler: SummarizationResponse
        Handler->>Handler: Format as MCP response
        Handler-->>Server: Return formatted result
        Server-->>Client: Tool response with content
    else Invalid Parameters
        Handler-->>Server: Throw Error
        Server-->>Client: Error response
    end
```

## Data Flow for kagi_summarize

```mermaid
flowchart TD
    Start[Request Received] --> Extract[Extract Parameters]
    Extract --> CheckURL{Has URL?}
    Extract --> CheckText{Has Text?}
    
    CheckURL -->|Yes| HasURL[url = value]
    CheckURL -->|No| NoURL[url = undefined]
    
    CheckText -->|Yes| HasText[text = value]
    CheckText -->|No| NoText[text = undefined]
    
    HasURL --> Validate{Validate<br/>Mutual<br/>Exclusivity}
    NoURL --> Validate
    HasText --> Validate
    NoText --> Validate
    
    Validate -->|Both provided| Error1[Error: Only one<br/>of url or text]
    Validate -->|Neither provided| Error2[Error: Either url<br/>or text required]
    Validate -->|Exactly one| Valid[Valid Input]
    
    Valid --> Defaults[Apply Defaults:<br/>engine=cecil<br/>summary_type=summary<br/>cache=true]
    
    Defaults --> API[Call kagi.summarize]
    API --> Success{API Call<br/>Success?}
    
    Success -->|Yes| Format[Format as MCP Response]
    Success -->|No| Error3[Catch & Wrap Error]
    
    Format --> Return[Return Result]
    Error1 --> Return
    Error2 --> Return
    Error3 --> Return
    
    style Valid fill:#90EE90
    style Error1 fill:#FFB6C1
    style Error2 fill:#FFB6C1
    style Error3 fill:#FFB6C1
```

## Code Structure Changes

```mermaid
graph LR
    subgraph "Before v0.1.0"
        Old[ListToolsRequestSchema<br/>1 tool: kagi_search]
        OldSwitch[CallToolRequestSchema<br/>1 case: kagi_search]
    end
    
    subgraph "After v0.2.0"
        New[ListToolsRequestSchema<br/>4 tools]
        NewSwitch[CallToolRequestSchema<br/>4 cases]
        
        New --> T1[kagi_search]
        New --> T2[kagi_summarize]
        New --> T3[kagi_fastgpt]
        New --> T4[kagi_enrich]
        
        NewSwitch --> C1[case: kagi_search]
        NewSwitch --> C2[case: kagi_summarize]
        NewSwitch --> C3[case: kagi_fastgpt]
        NewSwitch --> C4[case: kagi_enrich]
    end
    
    Old -.->|Extend| New
    OldSwitch -.->|Extend| NewSwitch
    
    style T2 fill:#FFB6C1
    style T3 fill:#FFB6C1
    style T4 fill:#FFB6C1
    style C2 fill:#FFB6C1
    style C3 fill:#FFB6C1
    style C4 fill:#FFB6C1
```

## Parameter Validation Logic

```mermaid
stateDiagram-v2
    [*] --> ExtractParams: Request Received
    
    state "Extract Parameters" as ExtractParams
    state "Validate Required" as ValidateRequired
    state "Validate Constraints" as ValidateConstraints
    state "Apply Defaults" as ApplyDefaults
    state "Call API" as CallAPI
    
    ExtractParams --> ValidateRequired
    
    state ValidateRequired {
        [*] --> CheckRequired
        CheckRequired --> RequiredMissing: Missing
        CheckRequired --> RequiredPresent: Present
        RequiredMissing --> [*]: Throw Error
        RequiredPresent --> [*]: Continue
    }
    
    ValidateRequired --> ValidateConstraints: Valid
    ValidateRequired --> [*]: Error
    
    state ValidateConstraints {
        [*] --> CheckConstraint
        CheckConstraint --> ConstraintViolation: Invalid
        CheckConstraint --> ConstraintValid: Valid
        ConstraintViolation --> [*]: Throw Error
        ConstraintValid --> [*]: Continue
    }
    
    ValidateConstraints --> ApplyDefaults: Valid
    ValidateConstraints --> [*]: Error
    
    ApplyDefaults --> CallAPI
    CallAPI --> [*]: Return Result
```

## Testing Flow

```mermaid
graph TD
    Start[Start Testing] --> T1[Test kagi_search<br/>Baseline]
    
    T1 --> T2[Test kagi_summarize]
    
    T2 --> T2a[Test with URL]
    T2 --> T2b[Test with text]
    T2 --> T2c[Test URL+text<br/>should fail]
    T2 --> T2d[Test no params<br/>should fail]
    T2 --> T2e[Test engines]
    T2 --> T2f[Test summary types]
    
    T2a --> T3[Test kagi_fastgpt]
    T2b --> T3
    T2c --> T3
    T2d --> T3
    T2e --> T3
    T2f --> T3
    
    T3 --> T3a[Test with query]
    T3 --> T3b[Test without query<br/>should fail]
    T3 --> T3c[Test cache options]
    
    T3a --> T4[Test kagi_enrich]
    T3b --> T4
    T3c --> T4
    
    T4 --> T4a[Test with query]
    T4 --> T4b[Test without query<br/>should fail]
    
    T4a --> Done[Testing Complete]
    T4b --> Done
    
    style T2c fill:#FFB6C1
    style T2d fill:#FFB6C1
    style T3b fill:#FFB6C1
    style T4b fill:#FFB6C1
```

## Implementation Complexity

| Tool | Parameters | Validation | Complexity |
|------|-----------|------------|------------|
| kagi_search | 2 (query, limit) | Basic | Low ⭐ |
| kagi_fastgpt | 2 (query, cache) | Basic | Low ⭐ |
| kagi_enrich | 1 (query) | Basic | Low ⭐ |
| kagi_summarize | 6 (url, text, engine, summary_type, target_language, cache) | Complex (XOR) | Medium ⭐⭐ |

## Risk Assessment

```mermaid
mindmap
  root((Phase 1<br/>Risks))
    Technical Risks
      TypeScript errors
      API parameter mismatches
      MCP protocol violations
    Validation Risks
      Incomplete url/text XOR check
      Missing parameter validation
      Type casting errors
    Testing Risks
      Insufficient test coverage
      Missing edge cases
      No integration tests
    Timeline Risks
      Underestimated complexity
      Debugging time
      Documentation needs
```

## Success Metrics

```mermaid
graph LR
    subgraph "Code Quality"
        Q1[No TypeScript<br/>errors]
        Q2[Consistent<br/>code style]
        Q3[Proper error<br/>handling]
    end
    
    subgraph "Functionality"
        F1[All tools<br/>discoverable]
        F2[All tools<br/>executable]
        F3[Validation<br/>works]
    end
    
    subgraph "Documentation"
        D1[Architecture<br/>documented]
        D2[API specs<br/>clear]
        D3[Testing guide<br/>complete]
    end
    
    Q1 --> Success[Phase 1<br/>Complete]
    Q2 --> Success
    Q3 --> Success
    F1 --> Success
    F2 --> Success
    F3 --> Success
    D1 --> Success
    D2 --> Success
    D3 --> Success
    
    style Success fill:#90EE90