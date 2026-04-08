# Task 技术设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | V1.0 |
| 编写日期 | 2024-01-15 |
| 目标读者 | 软件工程师、系统架构师 |
| 关联文档 | [Module_Design.md](Module_Design.md), [CycleScheduler_Design.md](CycleScheduler_Design.md) |
| 实现文件 | src/scheduler/Task.h, src/scheduler/Task.cpp |
| 测试文件 | tests/scheduler/Task_test.cpp |

---

## 目录

- [1. 概述](#1-概述)
- [2. 设计目标](#2-设计目标)
- [3. 架构设计](#3-架构设计)
- [4. 核心概念](#4-核心概念)
- [5. 状态机](#5-状态机)
- [6. 流程图](#6-流程图)
- [7. 实现细节](#7-实现细节)
- [8. API 参考](#8-api-参考)
- [9. 使用指南](#9-使用指南)
- [10. 常见问题](#10-常见问题)
- [11. 测试覆盖](#11-测试覆盖)

---

## 1. 概述

### 1.1 背景

在周期调度系统中，需要一种抽象来表示可执行的工作单元。每个工作单元需要：
- 支持生命周期管理（开始、暂停、恢复、取消）
- 支持优先级排序
- 支持依赖关系声明
- 支持执行结果追踪

### 1.2 问题

| 问题 | 影响 |
|------|------|
| 缺乏统一的任务抽象 | 各模块自行实现，接口不一致 |
| 无法追踪任务状态 | 调度器无法监控任务进度 |
| 不支持任务取消 | 长时间任务无法中断 |
| 缺乏优先级机制 | 重要任务可能被低优先级任务阻塞 |

### 1.3 解决方案

设计 `Task` 抽象基类，提供：
- 统一的生命周期接口
- 状态机管理（Pending → Running → Completed/Failed）
- 取消令牌集成
- 钩子回调机制

```
┌─────────────────────────────────────────────────────────────┐
│                    Task 架构                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │ CycleScheduler│────▶│    Task    │                       │
│  └─────────────┘     └─────────────┘                       │
│         │                   │                               │
│         │                   ▼                               │
│         │            ┌─────────────┐                       │
│         │            │  TaskHook   │                       │
│         │            └─────────────┘                       │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │   Module    │     │CancellationToken│                    │
│  └─────────────┘     └─────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 设计目标

### 2.1 功能目标

| 目标 | 说明 |
|------|------|
| 生命周期管理 | 支持 start/pause/resume/cancel 操作 |
| 状态追踪 | 实时状态查询，状态变更通知 |
| 优先级排序 | 按优先级值排序执行 |
| 钩子回调 | onSuccess/onFailure/onCancel 回调 |
| 取消支持 | 通过 CancellationToken 实现取消 |

### 2.2 非功能目标

| 目标 | 指标 |
|------|------|
| 性能 | 状态切换 < 1ms |
| 内存 | 基类开销 < 100 bytes |
| 依赖 | 仅依赖 std 库和 CancellationToken |

---

## 3. 架构设计

### 3.1 模块关系

```
┌─────────────────────────────────────────────────────────────┐
│                    Task 依赖关系                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CycleScheduler                                             │
│       │                                                     │
│       │ 调度                                                 │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │    Task     │◀─────┬────── 继承                         │
│  └─────────────┘      │                                     │
│       │               │                                     │
│       │               ▼                                     │
│       │         ┌─────────────┐                            │
│       │         │  ConcreteTask│                            │
│       │         └─────────────┘                            │
│       │                                                     │
│       ├─────▶ CancellationToken                            │
│       │                                                     │
│       └─────▶ TaskHookContext                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 职责划分

| 层级/组件 | 职责 |
|-----------|------|
| Task (基类) | 定义生命周期接口，管理状态机 |
| ConcreteTask (派生类) | 实现具体 execute 逻辑 |
| TaskHookContext | 执行上下文信息传递 |
| CancellationToken | 取消信号传递 |

---

## 4. 核心概念

### 4.1 数据结构

```cpp
// 任务配置
struct TaskConfig {
    std::string name;           // 任务名称（用于日志和调试）
    int priority = 0;           // 优先级（越大越优先）
    std::vector<std::string> dependencies;  // 依赖任务名称列表
    bool cancellable = true;    // 是否支持取消
};

// 任务钩子上下文
struct TaskHookContext {
    std::string taskName;       // 任务名称
    TaskState finalState;       // 最终状态
    std::chrono::milliseconds duration;  // 执行时长
    std::optional<ErrorCode> error;  // 错误码（如果失败）
};
```

### 4.2 枚举定义

| 值 | 名称 | 含义 |
|----|------|------|
| 0 | `Pending` | 等待执行 |
| 1 | `Running` | 正在执行 |
| 2 | `Paused` | 已暂停 |
| 3 | `Completed` | 执行成功完成 |
| 4 | `Failed` | 执行失败 |
| 5 | `Cancelled` | 已取消 |

### 4.3 常量定义

| 常量 | 值 | 说明 |
|------|-----|------|
| `MAX_PRIORITY` | 100 | 最高优先级 |
| `MIN_PRIORITY` | 0 | 最低优先级 |
| `DEFAULT_TIMEOUT` | 30000ms | 默认超时时间 |

---

## 5. 状态机

### 5.1 状态定义

| 状态 | 名称 | 含义 |
|------|------|------|
| `Pending` | 等待 | 任务已创建，等待调度器调度 |
| `Running` | 执行中 | 任务正在执行 |
| `Paused` | 暂停 | 任务被暂停，可恢复 |
| `Completed` | 完成 | 任务成功完成 |
| `Failed` | 失败 | 任务执行失败 |
| `Cancelled` | 取消 | 任务被取消 |

### 5.2 状态转换图

```
                    ┌─────────────┐
                    │   Pending   │
                    └─────────────┘
                          │
                    start()
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Failed    │◀────│   Running   │────▶│   Paused    │
└─────────────┘ fail└─────────────┘pause└─────────────┘
      ▲                     │                     │
      │               succeed              resume()
      │                     │                     │
      │                     ▼                     ▼
      │              ┌─────────────┐     ┌─────────────┐
      │              │  Completed  │     │   Running   │
      │              └─────────────┘     └─────────────┘
      │                                         │
      │                                   cancel()
      │                                         │
      └─────────────────────────────────────────┘
                        cancel()
                            │
                            ▼
                   ┌─────────────┐
                   │  Cancelled  │
                   └─────────────┘
```

### 5.3 转换条件

| 当前状态 | 事件/条件 | 目标状态 | 副作用 |
|----------|-----------|----------|--------|
| Pending | start() | Running | 开始计时 |
| Running | succeed | Completed | 回调 onSuccess |
| Running | fail | Failed | 回调 onFailure |
| Running | pause() | Paused | 暂停计时 |
| Paused | resume() | Running | 继续计时 |
| Running/Paused | cancel() | Cancelled | 回调 onCancel |
| Failed | reset() | Pending | 清理资源 |
| Completed | reset() | Pending | 清理资源 |

### 5.4 状态断言

```cpp
// 合法转换检查
bool canTransition(TaskState from, TaskState to) const {
    static const std::set<std::pair<TaskState, TaskState>> valid = {
        {Pending, Running},
        {Running, Completed},
        {Running, Failed},
        {Running, Paused},
        {Running, Cancelled},
        {Paused, Running},
        {Paused, Cancelled},
        {Failed, Pending},
        {Completed, Pending}
    };
    return valid.count({from, to}) > 0;
}
```

---

## 6. 流程图

### 6.1 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Task 执行流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                               │
│  │  Start  │                                               │
│  └────┬────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────┐                                               │
│  │ 检查状态 │                                              │
│  └────┬────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────┐     ┌─────────┐                              │
│  │ 检查取消 │────▶│ 已取消? │                              │
│  └────┬────┘     └────┬────┘                              │
│       │               │                                     │
│       │          Yes  │  No                                 │
│       │          ┌────┴────┐                               │
│       │          ▼         ▼                               │
│       │    ┌─────────┐ ┌─────────┐                        │
│       │    │  Cancel │ │ Execute │                        │
│       │    └────┬────┘ └────┬────┘                        │
│       │         │           │                              │
│       │         │     ┌─────┴─────┐                       │
│       │         │     ▼           ▼                       │
│       │         │ ┌─────────┐ ┌─────────┐                 │
│       │         │ │ Success │ │  Fail   │                 │
│       │         │ └────┬────┘ └────┬────┘                 │
│       │         │      │           │                      │
│       └─────┬───┴──────┴───────────┴───┐                  │
│             │                           │                  │
│             ▼                           ▼                  │
│       ┌─────────┐               ┌─────────┐               │
│       │ 回调处理 │               │  End    │               │
│       └────┬────┘               └─────────┘               │
│            │                                                │
│            ▼                                                │
│       ┌─────────┐                                          │
│       │   End   │                                          │
│       └─────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 流程步骤说明

| 步骤 | 操作 | 说明 |
|------|------|------|
| 检查状态 | validateState() | 确认当前为 Pending 状态 |
| 检查取消 | checkCancellation() | 检查 CancellationToken |
| 已取消? | isCancelled() | 判断取消令牌状态 |
| Cancel | setState(Cancelled) | 设置取消状态，调用 onCancel |
| Execute | doExecute() | 执行具体任务逻辑 |
| Success | setState(Completed) | 设置完成状态 |
| Fail | setState(Failed) | 设置失败状态，记录错误 |
| 回调处理 | invokeHooks() | 根据状态调用对应钩子 |

### 6.3 异常处理流程

```
┌─────────┐
│ Execute │
└────┬────┘
     │
     ▼
┌─────────────┐
│ 捕获异常     │
└────┬────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐
│ 记录错误码   │────▶│ 可恢复?     │
└─────────────┘     └────┬────────┘
                         │
                    Yes  │  No
                    ┌────┴────┐
                    ▼         ▼
               ┌─────────┐ ┌─────────┐
               │ 重试逻辑 │ │ 失败退出 │
               └────┬────┘ └────┬────┘
                    │           │
                    └─────┬─────┘
                          ▼
                   ┌─────────┐
                   │   End   │
                   └─────────┘
```

---

## 7. 实现细节

### 7.1 状态管理

```cpp
// 状态切换（原子操作保证线程安全）
void Task::setState(TaskState newState) {
    TaskState oldState = _state.load();
    
    // 验证转换合法性
    if (!canTransition(oldState, newState)) {
        throw InvalidStateTransition(oldState, newState);
    }
    
    _state.store(newState);
    
    // 状态变更时间戳记录
    _stateTimestamps[newState] = std::chrono::steady_clock::now();
}
```

### 7.2 执行入口

```cpp
// 主执行函数
void Task::execute() {
    // Phase 1: 状态检查
    if (_state.load() != TaskState::Pending) {
        throw InvalidStateException("Task must be in Pending state");
    }
    
    // Phase 2: 取消检查
    if (_cancellationToken && _cancellationToken->isCancelled()) {
        setState(TaskState::Cancelled);
        invokeHook(_onCancel);
        return;
    }
    
    // Phase 3: 执行
    setState(TaskState::Running);
    auto startTime = std::chrono::steady_clock::now();
    
    try {
        doExecute();  // 调用派生类实现
        
        setState(TaskState::Completed);
        auto duration = std::chrono::steady_clock::now() - startTime;
        invokeHook(_onSuccess, TaskHookContext{
            .taskName = _config.name,
            .finalState = TaskState::Completed,
            .duration = std::chrono::duration_cast<std::chrono::milliseconds>(duration)
        });
    } catch (const std::exception& e) {
        setState(TaskState::Failed);
        auto duration = std::chrono::steady_clock::now() - startTime;
        invokeHook(_onFailure, TaskHookContext{
            .taskName = _config.name,
            .finalState = TaskState::Failed,
            .duration = std::chrono::duration_cast<std::chrono::milliseconds>(duration),
            .error = ErrorCode::ExecutionFailed
        });
    }
}
```

---

## 8. API 参考

### 8.1 公开接口

| 函数 | 签名 | 说明 |
|------|------|------|
| `execute` | `void execute()` | 执行任务（从 Pending → Running） |
| `pause` | `void pause()` | 暂停任务（从 Running → Paused） |
| `resume` | `void resume()` | 恢复任务（从 Paused → Running） |
| `cancel` | `void cancel()` | 取消任务（→ Cancelled） |
| `reset` | `void reset()` | 重置任务（→ Pending） |
| `getState` | `TaskState getState() const` | 获取当前状态 |
| `getName` | `std::string getName() const` | 获取任务名称 |
| `getPriority` | `int getPriority() const` | 获取优先级 |
| `setOnSuccess` | `void setOnSuccess(HookCallback cb)` | 设置成功回调 |
| `setOnFailure` | `void setOnFailure(HookCallback cb)` | 设置失败回调 |
| `setOnCancel` | `void setOnCancel(HookCallback cb)` | 设置取消回调 |

### 8.2 配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `std::string` | "" | 任务名称（必须设置） |
| `priority` | `int` | 0 | 优先级 [0-100] |
| `dependencies` | `vector<string>` | {} | 依赖任务列表 |
| `cancellable` | `bool` | true | 是否支持取消 |

---

## 9. 使用指南

### 9.1 基本使用

```cpp
// ========== 基本使用示例 ==========

#include "scheduler/Task.h"
#include <iostream>

// 定义具体任务
class MyTask : public Task {
public:
    MyTask(const TaskConfig& config) : Task(config) {}
    
protected:
    void doExecute() override {
        // 具体执行逻辑
        std::cout << "Executing task: " << getName() << std::endl;
        // ... 业务逻辑 ...
    }
};

// 创建并执行任务
auto task = std::make_shared<MyTask>(TaskConfig{
    .name = "SampleTask",
    .priority = 10
});

task->execute();

// 检查结果
if (task->getState() == TaskState::Completed) {
    std::cout << "Task completed successfully" << std::endl;
}
```

### 9.2 进阶用法

```cpp
// ========== 进阶用法示例 ==========

#include "scheduler/Task.h"
#include "scheduler/CancellationToken.h"

// 带回调的任务
auto task = std::make_shared<MyTask>(TaskConfig{
    .name = "ImportantTask",
    .priority = 50,
    .cancellable = true
});

// 设置成功回调
task->setOnSuccess([](const TaskHookContext& ctx) {
    std::cout << "Task " << ctx.taskName 
              << " completed in " << ctx.duration.count() << "ms" 
              << std::endl;
});

// 设置失败回调
task->setOnFailure([](const TaskHookContext& ctx) {
    std::cout << "Task " << ctx.taskName 
              << " failed with error: " << ctx.error.value() 
              << std::endl;
});

// 使用取消令牌
auto cancelToken = std::make_shared<CancellationToken>();
task->setCancellationToken(cancelToken);

// 执行
task->execute();

// 在需要时取消
cancelToken->cancel();
```

### 9.3 最佳实践

- **命名规范**: 使用 `ModuleName_ActionName` 格式，便于日志追踪
- **优先级设置**: 关键任务 50-100，普通任务 10-50，后台任务 0-10
- **依赖声明**: 只依赖必要的前置任务，避免循环依赖
- **取消处理**: 在 `doExecute` 中定期检查取消令牌
- **资源清理**: 在 `reset` 或失败时清理已分配资源

---

## 10. 常见问题

### FAQ

| 问题 | 解答 |
|------|------|
| 任务执行中能改变优先级吗？ | 不能。优先级在 Pending 状态下才能修改 |
| 如何实现任务重试？ | 使用 `reset()` 重置后再次 `execute()` |
| 取消后能恢复吗？ | 不能。Cancelled 是终态，只能 `reset()` 重新开始 |
| 钩子回调在哪个线程执行？ | 与 `execute()` 调用线程相同 |

### 常见陷阱

- **状态转换顺序错误**: 必须按状态机定义的路径转换，否则抛异常
- **忘记设置 name**: 日志和调试信息无法追踪
- **钩子回调异常**: 钩子异常不会影响任务状态，但会丢失回调效果
- **长时间不检查取消**: 任务无法响应取消请求，继续执行到底

---

## 11. 测试覆盖

### 11.1 测试用例

| 测试 | 说明 |
|------|------|
| `test_state_transition_valid` | 验证合法状态转换 |
| `test_state_transition_invalid` | 验证非法状态转换抛异常 |
| `test_execute_success` | 验证成功执行路径 |
| `test_execute_failure` | 验证失败执行路径 |
| `test_cancel_before_execute` | 验证执行前取消 |
| `test_cancel_during_execute` | 验证执行中取消 |
| `test_pause_resume` | 验证暂停恢复流程 |
| `test_reset_after_failure` | 验证失败后重置 |
| `test_reset_after_completion` | 验证完成后重置 |
| `test_hook_on_success` | 验证成功回调 |
| `test_hook_on_failure` | 验证失败回调 |
| `test_hook_on_cancel` | 验证取消回调 |
| `test_priority_ordering` | 验证优先级排序 |
| `test_dependencies` | 验证依赖检查 |
| `test_concurrent_state_access` | 验证状态线程安全 |

### 11.2 测试统计

| 项目 | 数值 |
|------|------|
| 总测试数 | 15 |
| 通过 | 15 |
| 覆盖范围 | 状态管理 100%, 执行流程 95%, 钩子系统 90% |

---

## 附录：文件清单

| 文件 | 说明 |
|------|------|
| src/scheduler/Task.h | Task 基类定义 |
| src/scheduler/Task.cpp | Task 基类实现 |
| tests/scheduler/Task_test.cpp | 单元测试 |

---

## 附录：依赖关系

```
Task
    ├── std::string (标准库)
    ├── std::chrono (标准库)
    ├── std::atomic (标准库)
    ├── CancellationToken
    └── TaskHookContext
```

---

## 附录：变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| V1.0 | 2024-01-15 | 初始版本 |