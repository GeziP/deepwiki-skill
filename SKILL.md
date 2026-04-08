---
name: deepwiki
description: Use when creating technical design documentation for a code module/class, or when user explicitly requests "deepwiki" documentation. Generates comprehensive docs with architecture diagrams, API reference, usage examples, and test coverage in DeepWiki style.
---

TRIGGER when: user says "generate deepwiki doc", "deepwiki <file>", "technical design document", "create documentation for X"
DO NOT TRIGGER when: user asks about general documentation concepts without requesting generation

# DeepWiki Technical Documentation Generator

## Overview

**DeepWiki is a technical documentation format specification emphasizing architecture visualization, API completeness, and runnable code examples.**

Core principles:
- One document per module
- ASCII diagrams instead of UML (lightweight, maintainable)
- API reference tables (signature + description)
- Runnable code examples
- Test coverage tracking
- State machine and flow diagram visualization

**Output path**: `doc/tech-docs/<ModuleName>_Design.md`

---

## Generation Process (Four Phases)

You MUST complete each phase before proceeding to the next.

### Phase 1: Source Analysis

**BEFORE generating ANY content:**

1. **Read Target File**
   - Parse class/struct definitions
   - Extract public APIs (methods, functions)
   - Identify internal implementation details
   - Find state variables and enums
   - Document dependencies (imports, includes)

2. **Identify Module Type**
   - Stateful module (has lifecycle states) → needs state machine diagram
   - Process module (has workflows) → needs flow diagram
   - Data module (structs, enums) → focus on data structures
   - Utility module (helpers) → focus on API reference

3. **Check Related Files**
   - Test files: `tests/<module>_test.cpp`, `test_<module>.py`
   - Config files: `<module>_config.h`, `<module>.yaml`
   - Related modules: imports/dependencies

### Phase 2: Context Gathering

**Collect supporting information:**

1. **Find Existing Docs**
   - Check `doc/tech-docs/` for related documents
   - Note version history, related modules
   - Extract cross-reference links

2. **Extract Test Coverage**
   - List test case names from test file
   - Identify covered functionality
   - Note missing test areas

3. **Check Git History**
   ```bash
   git log --oneline --follow <file> | head -10
   ```
   - Recent changes
   - Author information
   - Change rationale

### Phase 3: Document Generation

**Use template.md structure (12 chapters):**

| Chapter | Content | Required |
|---------|---------|----------|
| Document Info | Version, date, audience, related docs, source files | ✓ |
| 1. Overview | Background, problem, solution (with ASCII architecture diagram) | ✓ |
| 2. Design Goals | Functional goals, non-functional goals | ✓ |
| 3. Architecture | Module relationship diagram, responsibility table | ✓ |
| 4. Core Concepts | Data structures, enum definitions, constant definitions | ✓ |
| 5. State Machine | State definitions, transition diagram, transition conditions | ○ |
| 6. Flow Diagram | Core flow diagram, step descriptions, exception handling | ○ |
| 7. Implementation | Key code snippets (with comments) | ✓ |
| 8. API Reference | Public interface table (signature, description) | ✓ |
| 9. Usage Guide | Complete runnable code examples | ✓ |
| 10. FAQ | FAQ, pitfalls, best practices | ○ |
| 11. Test Coverage | Test case table, coverage scope | ✓ |
| Appendix | File list, dependencies, change history | ○ |

(✓ = Required, ○ = Optional - based on module type)

### Phase 4: Quality Verification

**Before outputting final document:**

1. **Check ASCII Diagrams**
   - All boxes properly closed
   - Arrows point in correct direction
   - Labels readable

2. **Verify Code Examples**
   - Examples are complete (not fragments)
   - Comments explain WHY, not just WHAT
   - Include import/include statements

3. **Cross-Reference Links**
   - Link to related docs using `[Module_Design.md]`
   - Link to source files using relative paths
   - Link to test files

4. **Final Review**
   - Document follows template.md structure
   - All required chapters present
   - Tables formatted correctly

---

## ASCII Diagram Styles

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Module Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │  ComponentA │────▶│  ComponentB │                       │
│  └─────────────┘     └─────────────┘                       │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │  ComponentC │     │  ComponentD │                       │
│  └─────────────┘     └─────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Elements**:
- `────▶` data flow/call direction
- `│` `▼` hierarchy relationship
- `┌─┐` `└─┘` borders

### State Machine Diagram

```
                    ┌─────────────┐
                    │   Initial   │
                    └─────────────┘
                          │
                    start()
                          │
                          ▼
┌─────────────┐     ┌─────────────┐
│   Failed    │◀────│   Running   │
└─────────────┘ fail└─────────────┘
                          │
                    succeed
                          │
                          ▼
                   ┌─────────────┐
                   │  Completed  │
                   └─────────────┘
```

**Elements**:
- `───▶` state transition direction
- `◀───` reverse transition
- Transition conditions labeled beside arrows

### Flow Diagram

```
┌─────────┐
│  Start  │
└────┬────┘
     │
     ▼
┌─────────┐     ┌─────────┐
│ Step 1  │────▶│ Step 2  │
└─────────┘     └────┬────┘
                     │
                ┌────┴────┐
                ▼         ▼
           ┌─────────┐ ┌─────────┐
           │  Yes    │ │   No    │
           └────┬────┘ └────┬────┘
                │           │
                └─────┬─────┘
                      ▼
               ┌─────────┐
               │   End   │
               └─────────┘
```

**Elements**:
- `┌───┐` rectangle boxes for steps
- `◀───▶` branch/merge
- `Yes/No` condition branch labels

---

## Code Example Style

```cpp
// ========== Basic Usage ==========

// Create a task
auto task = std::make_shared<Task>(Task::Config{
    .name = "SampleTask",
    .priority = 10
});

// Execute
task->execute();

// ========== Advanced Usage ==========

// With callback
task->setOnSuccess([](const TaskHookContext& ctx) {
    std::cout << "Task " << ctx.taskName << " completed\n";
});
```

**Requirements**:
- `// ========== Title ==========` section headers
- Comments explain WHY (why doing this)
- Examples must be runnable (include necessary imports/includes)

---

## Template Reference

See `template.md` for the complete chapter structure with placeholders:

| Placeholder | Description |
|-------------|-------------|
| `{{MODULE_NAME}}` | Module name (e.g., Task, Module) |
| `{{FILE_PATH}}` | Source file path |
| `{{VERSION}}` | Document version (default: V1.0) |
| `{{DATE}}` | Current date |
| `{{RELATED_DOCS}}` | Related document links |
| `{{TEST_FILE}}` | Test file path |

---

## Example Output

See `examples/Task_Design.md` for a complete example document demonstrating:
- 12 chapters properly filled
- ASCII diagrams (architecture, state machine, flow)
- Code examples with comments
- API reference tables
- Test coverage table

---

## Quick Reference

| Input | Output |
|-------|--------|
| `deepwiki src/scheduler/Task.h` | `doc/tech-docs/Task_Design.md` |
| `create documentation for Task` | `doc/tech-docs/Task_Design.md` |
| `technical design document for this module` | Document for identified module |

---

## Red Flags - STOP and Re-analyze

If you encounter:
- Cannot find source file → Ask user for correct path
- Multiple classes in one file → Ask which to document, or suggest splitting
- No test file found → Note in document, suggest creating tests
- Complex dependency graph → Focus on direct dependencies, list indirect in appendix

**DO NOT:**
- Guess module functionality without reading source
- Create diagrams without understanding relationships
- Copy template without filling with actual content
- Skip required chapters even if content seems thin