[English](README.md) | [中文](README.zh-CN.md)

# DeepWiki 技术文档生成 Skill

用于生成技术设计文档的 Claude Code Skill，包含 ASCII 架构图、API 参考、可运行代码示例。支持中英文双语。

## 快速开始

```bash
# 安装到 Claude Code skills 目录
git clone https://github.com/GeziP/deepwiki-skill.git ~/.claude/skills/deepwiki-skill
```

就这么简单，无需其他配置。

## 使用

```
> deepwiki src/scheduler/Task.h
> 给 Task 生成 deepwiki 文档
> generate doc for Module class
```

自动识别语言：
- 中文对话 → 使用 `template.md`（中文模板）
- 英文对话 → 使用 `template.en.md`（英文模板）

输出：`doc/tech-docs/<ModuleName>_Design.md`

## 文件结构

```
deepwiki-skill/
├── SKILL.md          # 主 skill 文件（双语触发）
├── template.md       # 中文模板（默认）
├── template.en.md    # 英文模板
├── examples/
│   └── Task_Design.md    # 完整示例（中文）
└ README.md          # 说明文档
```

## 特性

- **ASCII 图表** - 架构图、状态机、流程图，无需 UML 工具
- **12 章结构** - 从概述到测试覆盖的完整模板
- **可运行示例** - 包含必要 import 的完整代码
- **API 参考表** - 签名、参数、返回值一目了然
- **双语支持** - 自动识别语言选择模板

## 模板

| 文件 | 语言 | 用途 |
|------|------|------|
| `template.md` | 中文 | 中文用户默认 |
| `template.en.md` | 英文 | 英文用户 |

## 文档结构

| 章节 | 内容 |
|------|------|
| 1. 概述 | 背景、问题、解决方案 + 架构图 |
| 2. 设计目标 | 功能目标、非功能目标 |
| 3. 架构设计 | 模块关系、职责划分 |
| 4. 核心概念 | 数据结构、枚举、常量 |
| 5. 状态机 | 状态定义、转换图（可选） |
| 6. 流程图 | 核心流程（可选） |
| 7. 实现细节 | 关键代码片段 |
| 8. API 参考 | 公开接口表 |
| 9. 使用指南 | 可运行示例 |
| 10. 常见问题 | FAQ（可选） |
| 11. 测试覆盖 | 测试用例表 |
| 附录 | 文件清单、依赖关系 |

## 示例

查看 [examples/Task_Design.md](examples/Task_Design.md) 了解完整输出格式。

## License

MIT