# DeepWiki 技术文档生成 Skill

一种用于生成技术设计文档的 Claude Code Skill，强调架构可视化、API 完整性和代码示例可运行性。

## 特性

- **ASCII 图表可视化** - 架构图、状态机、流程图，无需 UML 工具
- **12 章标准结构** - 从概述到测试覆盖的完整模板
- **可运行代码示例** - 包含必要 import/include 的完整示例
- **API 参考表** - 函数签名、参数、返回值一目了然
- **测试覆盖追踪** - 自动提取测试用例信息

## 安装

### Claude Code

```bash
git clone https://github.com/GeziP/deepwiki-skill.git ~/.claude/skills/deepwiki-skill
```

### Cursor / 其他 AI IDE

将项目克隆到对应 skills 目录中。

## 使用

在 Claude Code 中：

```
> deepwiki src/scheduler/Task.h
> 给 Task 生成 deepwiki 文档
> 为 Module 类写一份技术设计文档
```

输出文件：`doc/tech-docs/<ModuleName>_Design.md`

## 文档结构

| 章节 | 内容 |
|------|------|
| 1. 概述 | 背景、问题、解决方案 + 架构图 |
| 2. 设计目标 | 功能目标、非功能目标 |
| 3. 架构设计 | 模块关系图、职责划分 |
| 4. 核心概念 | 数据结构、枚举、常量 |
| 5. 状态机 | 状态定义、转换图（可选） |
| 6. 流程图 | 核心流程（可选） |
| 7. 实现细节 | 关键代码片段 |
| 8. API 参考 | 公开接口表 |
| 9. 使用指南 | 可运行示例 |
| 10. 常见问题 | FAQ、陷阱（可选） |
| 11. 测试覆盖 | 测试用例表 |
| 附录 | 文件清单、依赖关系 |

## 示例

查看 [examples/Task_Design.md](examples/Task_Design.md) 了解完整的输出格式。

## ASCII 图表风格

### 架构图

```
┌─────────────┐     ┌─────────────┐
│  ComponentA │────▶│  ComponentB │
└─────────────┘     └─────────────┘
```

### 状态机

```
┌─────────────┐     ┌─────────────┐
│   Initial   │────▶│   Running   │
└─────────────┘     └─────────────┘
```

### 流程图

```
┌─────────┐
│  Start  │
└────┬────┘
     ▼
┌─────────┐
│ Process │
└─────────┘
```

## 模板

查看 [template.md](template.md) 了解完整的章节结构和占位符说明。

## License

MIT