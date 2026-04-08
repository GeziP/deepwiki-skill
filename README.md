[English](README.md) | [中文](README.zh-CN.md)

# DeepWiki Technical Documentation Generator

A Claude Code skill for generating technical design documentation with ASCII diagrams, API references, and runnable code examples. Supports both English and Chinese.

## Quick Start

```bash
# Install to Claude Code skills directory
git clone https://github.com/GeziP/deepwiki-skill.git ~/.claude/skills/deepwiki-skill
```

That's it. No additional setup required.

## Usage

```
> deepwiki src/scheduler/Task.h
> 给 Task 生成 deepwiki 文档
> generate doc for Module class
```

The skill automatically detects your language:
- Chinese conversation → uses `template.md` (Chinese template)
- English conversation → uses `template.en.md` (English template)

Output: `doc/tech-docs/<ModuleName>_Design.md`

## File Structure

```
deepwiki-skill/
├── SKILL.md          # Main skill file (bilingual triggers)
├── template.md       # Chinese template (default)
├── template.en.md    # English template
├── examples/
│   └── Task_Design.md    # Complete example (Chinese)
└── README.md         # This file
```

## Features

- **ASCII Diagrams** - Architecture, state machines, flow charts - no UML tools needed
- **12-Chapter Structure** - Complete template from overview to test coverage
- **Runnable Examples** - Complete code with necessary imports
- **API Reference Tables** - Signatures, parameters, return values
- **Bilingual Support** - Automatic language detection

## Templates

| File | Language | Usage |
|------|----------|-------|
| `template.md` | 中文 | Default for Chinese users |
| `template.en.md` | English | For English users |

## Document Structure

| Chapter | Content |
|---------|---------|
| 1. Overview | Background, problem, solution + architecture diagram |
| 2. Design Goals | Functional & non-functional goals |
| 3. Architecture | Module relationships, responsibilities |
| 4. Core Concepts | Data structures, enums, constants |
| 5. State Machine | State definitions, transitions (optional) |
| 6. Flow Diagram | Core workflows (optional) |
| 7. Implementation | Key code snippets |
| 8. API Reference | Public interface table |
| 9. Usage Guide | Runnable examples |
| 10. FAQ | Common questions (optional) |
| 11. Test Coverage | Test case table |
| Appendix | File list, dependencies, history |

## Example

See [examples/Task_Design.md](examples/Task_Design.md) for a complete output example.

## License

MIT