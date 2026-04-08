[English](README.md) | [中文](README.zh-CN.md)

# DeepWiki Technical Documentation Generator

A Claude Code Skill for generating technical design documentation, emphasizing architecture visualization, API completeness, and runnable code examples.

## Features

- **ASCII Diagram Visualization** - Architecture, state machines, flow diagrams - no UML tools needed
- **12-Chapter Standard Structure** - Complete template from overview to test coverage
- **Runnable Code Examples** - Complete examples with necessary import/include statements
- **API Reference Tables** - Function signatures, parameters, return values at a glance
- **Test Coverage Tracking** - Automatic test case extraction

## Installation

### Claude Code

```bash
git clone https://github.com/GeziP/deepwiki-skill.git ~/.claude/skills/deepwiki-skill
```

### Cursor / Other AI IDEs

Clone the project to the corresponding skills directory.

## Usage

In Claude Code:

```
> deepwiki src/scheduler/Task.h
> generate deepwiki doc for Task
> create technical design document for Module class
```

Output file: `doc/tech-docs/<ModuleName>_Design.md`

## Document Structure

| Chapter | Content |
|---------|---------|
| 1. Overview | Background, problem, solution + architecture diagram |
| 2. Design Goals | Functional goals, non-functional goals |
| 3. Architecture | Module relationships, responsibility division |
| 4. Core Concepts | Data structures, enums, constants |
| 5. State Machine | State definitions, transition diagram (optional) |
| 6. Flow Diagram | Core workflow (optional) |
| 7. Implementation | Key code snippets |
| 8. API Reference | Public interface table |
| 9. Usage Guide | Runnable examples |
| 10. FAQ | FAQ, pitfalls (optional) |
| 11. Test Coverage | Test case table |
| Appendix | File list, dependencies |

## Example

See [examples/Task_Design.md](examples/Task_Design.md) for a complete output format example.

## ASCII Diagram Styles

### Architecture Diagram

```
┌─────────────┐     ┌─────────────┐
│  ComponentA │────▶│  ComponentB │
└─────────────┘     └─────────────┘
```

### State Machine

```
┌─────────────┐     ┌─────────────┐
│   Initial   │────▶│   Running   │
└─────────────┘     └─────────────┘
```

### Flow Diagram

```
┌─────────┐
│  Start  │
└────┬────┘
     ▼
┌─────────┐
│ Process │
└─────────┘
```

## Template

See [template.md](template.md) for the complete chapter structure and placeholder descriptions.

## License

MIT