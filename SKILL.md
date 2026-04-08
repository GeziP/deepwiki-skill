---
name: deepwiki
description: 用于生成代码模块/类的技术设计文档。生成包含架构图、API 参考、使用示例和测试覆盖的完整文档，支持中英文。
---

TRIGGER when: 
  - 用户说 "生成 deepwiki 文档", "deepwiki <file>", "技术设计文档", "给 X 写文档", "为这个模块生成文档"
  - 用户说 "generate deepwiki doc", "deepwiki <file>", "technical design document", "create documentation for X"
DO NOT TRIGGER when: user asks about general documentation concepts without requesting generation

# DeepWiki 技术文档生成器 / Technical Documentation Generator

## Overview / 概述

**DeepWiki is a technical documentation format emphasizing architecture visualization, API completeness, and runnable code examples.**

**DeepWiki 是一种技术文档格式，强调架构可视化、API 完整性和代码示例可运行性。**

Core principles / 核心原则：
- One document per module / 每个模块一份独立文档
- ASCII diagrams instead of UML / ASCII 图表代替 UML
- API reference tables / API 参考表
- Runnable code examples / 可运行代码示例
- Test coverage tracking / 测试覆盖追踪

**Output path / 输出路径**: `doc/tech-docs/<ModuleName>_Design.md`

---

## Language Selection / 语言选择

When generating documentation, detect user's language preference:
生成文档时，检测用户语言偏好：

- If user speaks Chinese → use `template.md` (中文模板)
- If user speaks English → use `template.en.md` (英文模板)
- User can explicitly specify: "用英文模板" / "use English template"

---

## Generation Process / 四阶段流程

Complete each phase before proceeding / 必须完成每个阶段才能进入下一阶段。

### Phase 1: Source Analysis / 源码分析

**Before generating any content / 生成任何内容之前:**

1. **Read Target File / 读取目标文件**
   - Parse class/struct definitions / 解析类/结构体定义
   - Extract public APIs / 提取公开 API
   - Identify implementation details / 识别实现细节
   - Find state variables and enums / 查找状态变量和枚举
   - Document dependencies / 记录依赖关系

2. **Identify Module Type / 识别模块类型**
   - Stateful module → needs state machine diagram / 有状态模块 → 需状态机图
   - Process module → needs flow diagram / 流程模块 → 需流程图
   - Data module → focus on data structures / 数据模块 → 侧重数据结构
   - Utility module → focus on API reference / 工具模块 → 侧重 API 参考

3. **Check Related Files / 检查相关文件**
   - Test files: `tests/<module>_test.*` / 测试文件
   - Config files / 配置文件
   - Related modules / 相关模块

### Phase 2: Context Gathering / 上下文收集

1. **Find Existing Docs / 查找现有文档**
   - Check `doc/tech-docs/` for related documents

2. **Extract Test Coverage / 提取测试覆盖**
   - List test case names from test file

3. **Check Git History / 检查 Git 历史**
   ```bash
   git log --oneline --follow <file> | head -10
   ```

### Phase 3: Document Generation / 文档生成

**Use template structure (12 chapters) / 使用模板结构（12 章节）:**

| Chapter / 章节 | Required / 必须 |
|----------------|-----------------|
| 1. Overview / 概述 | ✓ |
| 2. Design Goals / 设计目标 | ✓ |
| 3. Architecture / 架构设计 | ✓ |
| 4. Core Concepts / 核心概念 | ✓ |
| 5. State Machine / 状态机 | ○ (if applicable) |
| 6. Flow Diagram / 流程图 | ○ (if applicable) |
| 7. Implementation / 实现细节 | ✓ |
| 8. API Reference / API 参考 | ✓ |
| 9. Usage Guide / 使用指南 | ✓ |
| 10. FAQ / 常见问题 | ○ |
| 11. Test Coverage / 测试覆盖 | ✓ |
| Appendix / 附录 | ○ |

### Phase 4: Quality Verification / 质量验证

1. ASCII diagrams properly formatted / ASCII 图表格式正确
2. Code examples runnable / 代码示例可运行
3. Cross-reference links present / 交叉引用链接存在

---

## ASCII Diagram Styles / ASCII 图表风格

### Architecture Diagram / 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Module Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │  ComponentA │────▶│  ComponentB │                       │
│  └─────────────┘     └─────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State Machine / 状态机

```
                    ┌─────────────┐
                    │   Initial   │
                    └─────────────┘
                          │
                    start()
                          ▼
┌─────────────┐     ┌─────────────┐
│   Failed    │◀────│   Running   │
└─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Completed  │
                   └─────────────┘
```

### Flow Diagram / 流程图

```
┌─────────┐     ┌─────────┐
│ Step 1  │────▶│ Step 2  │
└─────────┘     └────┬────┘
                     │
                ┌────┴────┐
                ▼         ▼
           ┌─────────┐ ┌─────────┐
           │  Yes    │ │   No    │
           └─────────┘ └─────────┘
```

---

## Code Example Style / 代码示例风格

```cpp
// ========== Basic Usage / 基本使用 ==========

// Create a task / 创建任务
auto task = std::make_shared<Task>(Task::Config{
    .name = "SampleTask",
    .priority = 10
});

task->execute();

// ========== Advanced Usage / 进阶用法 ==========

// With callback / 带回调
task->setOnSuccess([](const TaskHookContext& ctx) {
    std::cout << "Task completed\n";
});
```

**Requirements / 要求**:
- `// ========== Title ========== ` section headers / 分节标题
- Comments explain WHY / 注释解释原因
- Include necessary imports/includes / 包含必要的导入

---

## Templates / 模板

| File / 文件 | Language / 语言 |
|-------------|-----------------|
| `template.md` | 中文（默认） |
| `template.en.md` | English / 英文 |

See templates for placeholders: `{{MODULE_NAME}}`, `{{FILE_PATH}}`, `{{VERSION}}`, `{{DATE}}`
查看模板了解占位符：`{{MODULE_NAME}}`, `{{FILE_PATH}}`, `{{VERSION}}`, `{{DATE}}`

---

## Example / 示例

See `examples/Task_Design.md` for a complete example document.
查看 `examples/Task_Design.md` 了解完整示例文档。

---

## Quick Reference / 快速参考

| Input / 输入 | Output / 输出 |
|--------------|---------------|
| `deepwiki src/Task.h` | `doc/tech-docs/Task_Design.md` |
| `给 Task 生成 deepwiki 文档` | `doc/tech-docs/Task_Design.md` |
| `generate doc for Task` | `doc/tech-docs/Task_Design.md` |

---

## Red Flags / 注意事项

- Cannot find source → Ask user for path / 找不到源文件 → 询问路径
- Multiple classes in one file → Ask which to document / 单文件多类 → 询问目标
- No test file → Note in document / 无测试文件 → 文档标注
- Complex dependencies → Focus on direct deps / 复杂依赖 → 侧重直接依赖

**DO NOT / 禁止**:
- Guess without reading source / 不读源码猜测功能
- Create diagrams without understanding / 不理解就画图
- Skip required chapters / 跳过必须章节