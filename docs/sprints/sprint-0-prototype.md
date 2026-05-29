# Sprint 0: 技术原型验证 (4 周)

## 目标
验证核心技术选型的可行性，产出 4 个可运行的 POC Demo。

---

## Week 1: 项目初始化 + 画布 POC

### Day 1-2: 项目脚手架

**任务:**
- [ ] 初始化 pnpm monorepo 项目结构
- [ ] 配置 Tauri 2.x 项目 (Rust + React/TS)
- [ ] 配置 ESLint, Prettier, TypeScript
- [ ] 配置 Vitest 测试框架
- [ ] 配置 Git hooks (husky + lint-staged)
- [ ] 创建基础 CI (GitHub Actions)

**交付物:**
```
Mind/
├── apps/desktop/
│   ├── src-tauri/
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── packages/shared/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Day 3-5: 画布引擎 POC

**任务:**
- [ ] 集成 PixiJS 8.x 到 React
- [ ] 实现基础画布容器 (无限平移/缩放)
- [ ] 实现节点渲染 (矩形 + 文字)
- [ ] 实现节点拖拽移动
- [ ] 实现双击创建节点
- [ ] 性能测试: 10,000 节点渲染

**验收标准:**
- 10,000 节点时 FPS > 50
- 缩放/平移操作流畅
- 节点拖拽无明显延迟

**关键技术决策:**
```
选 PixiJS 8 而非 Canvas API:
- WebGL 渲染，大量对象性能优秀
- 容器层级系统天然支持节点层级
- 内置的交互管理器 (InteractionManager)
- 社区活跃，文档完善
```

---

## Week 2: 本地存储 POC + 连接线

### Day 1-3: SQLite 持久化

**任务:**
- [ ] 设计 SQLite 表结构 (canvases, nodes, edges)
- [ ] 实现 Tauri Commands: createCanvas, createNode, updateNode, deleteNode
- [ ] 实现 rusqlite CRUD 操作
- [ ] 实现自动保存 (防抖 500ms)
- [ ] 实现应用启动时加载画布数据

**验收标准:**
- 创建/更新/删除节点后数据持久化
- 应用重启后数据完整恢复
- 保存操作不阻塞 UI

### Day 4-5: 连接线渲染

**任务:**
- [ ] 实现从节点边缘拖拽创建连接线
- [ ] 实现连接线渲染 (贝塞尔曲线)
- [ ] 实现连接线跟随节点移动
- [ ] 实现连接线标签编辑

---

## Week 3: AI 对话 POC

### Day 1-2: AI 后端代理

**任务:**
- [ ] 实现 Tauri Command: ai_chat (流式响应)
- [ ] 集成 Claude API (reqwest + SSE)
- [ ] 实现流式响应转发到前端
- [ ] 实现基础 Prompt 模板系统

**代码示例 (Rust):**
```rust
// src-tauri/src/commands/ai.rs
#[tauri::command]
pub async fn ai_chat(
    app: tauri::AppHandle,
    message: String,
    context: Option<String>,
    persona: Option<String>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let system_prompt = build_persona_prompt(persona.as_deref().unwrap_or("default"));
    
    let body = serde_json::json!({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 2048,
        "stream": true,
        "system": system_prompt,
        "messages": [{ "role": "user", "content": message }]
    });
    
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", get_api_key(&app))
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    // 流式读取并转发
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        // 解析 SSE 事件并发送到前端
        app.emit("ai-stream-chunk", chunk_data)?;
    }
    
    Ok(())
}
```

### Day 3-4: AI 前端界面

**任务:**
- [ ] 实现 AI 气泡组件 (出现在节点旁)
- [ ] 实现流式文字逐字显示
- [ ] 实现 @AI 触发交互
- [ ] 实现上下文收集 (当前节点内容)

### Day 5: AI 人格系统

**任务:**
- [ ] 创建 3 个预设人格 Prompt (苏格拉底、乔布斯、费曼)
- [ ] 实现人格切换 UI (@ 命令列表)
- [ ] 测试不同人格的回复质量

---

## Week 4: 钱包 POC + 集成测试

### Day 1-2: 钱包与确权

**任务:**
- [ ] 实现钱包生成 (ed25519 密钥对)
- [ ] 实现助记词生成与备份引导
- [ ] 实现内容哈希计算 (SHA-256)
- [ ] 实现基础确权交易构建 (Arbitrum Sepolia)

### Day 3-4: 集成与打磨

**任务:**
- [ ] 集成所有 POC 到统一界面
- [ ] 基础 UI 打磨 (深色主题)
- [ ] 迷你地图组件
- [ ] 全局搜索 (SQLite FTS5)

### Day 5: POC 演示与评审

**任务:**
- [ ] 录制 POC 演示视频
- [ ] 编写技术评审文档
- [ ] 记录发现的问题和改进方向
- [ ] 制定 Sprint 1 详细计划

---

## Sprint 0 技术栈确认

| 组件 | 选择 | 版本 | 状态 |
|------|------|------|------|
| 桌面框架 | Tauri | 2.x | 确认 |
| 前端框架 | React + TypeScript | 19.x | 确认 |
| 画布引擎 | PixiJS | 8.x | 待 POC 验证 |
| 本地数据库 | SQLite (rusqlite) | - | 确认 |
| AI 服务 | Claude API | Sonnet 4 | 确认 |
| 区块链 | Arbitrum Sepolia | - | 确认 |
| 智能合约 | Solidity + Hardhat | 0.8.x | 确认 |

### 研究代理建议的关键调整

基于 4 个研究代理的深度研究，以下技术选型需要更新:

| 组件 | 原方案 | 研究建议 | 决策 |
|------|--------|----------|------|
| CRDT | Yjs/Yrs | **Loro v1.0** (MovableTree 更适合画布) | Sprint 1 引入 |
| P2P 网络 | Libp2p | **Iroh** (更简单、Rust 原生、QUIC) | Sprint 1+ 引入 |
| L2 网络 | Arbitrum | **Base (OP Stack)** (消费级生态更好) | 待评估 |
| 用户上链 | 钱包导入 | **Privy + Account Kit** (邮箱登录, 无 Gas) | MVP 考虑 |
| 想法代币 | ERC-721 | **ERC-721 + ERC-6551** (Token-Bound Account) | Sprint 3 |
| 画布引擎 | PixiJS | **tldraw** (开源画布框架，可直接嵌入) | 待评估 |
