# MindSpace 系统架构设计

## 一、架构设计原则

### 核心原则
1. **渐进式去中心化**: 从中心化辅助平滑过渡到完全社区自治
2. **协议大于平台**: 协议层与应用层清晰分离，支持第三方客户端
3. **本地优先 (Local-First)**: 数据首先属于用户，离线可用，极致响应
4. **模块化与可组合性**: 身份、数据、通信、AI、价值高度解耦
5. **成本与性能务实平衡**: 只有核心状态上链，海量数据链下处理

---

## 二、整体架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 4: 应用层                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ MindSpace   │ │ MindWorld   │ │ 第三方客户端         │   │
│  │ Desktop     │ │ Web         │ │ (未来生态)           │   │
│  │ (Tauri 2.x) │ │ (React)     │ │                      │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Layer 3: 服务层                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ AI 网关   │ │ IPFS     │ │ 索引服务  │ │ 通知服务     │  │
│  │ Gateway   │ │ Gateway  │ │ Indexer  │ │ Notification │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Layer 2: 价值与共识层                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ethereum L2 (Arbitrum/Base)                         │  │
│  │  ├── MIND_Token.sol (ERC-20)                         │  │
│  │  ├── IdeaRegistry.sol (想法确权)                      │  │
│  │  ├── SparkReward.sol (积分奖励)                       │  │
│  │  └── DAO_Governor.sol (治理)                          │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Layer 1: 数据层                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ SQLite   │ │ IPFS     │ │ Arweave  │ │ OrbitDB      │  │
│  │ (热数据)  │ │ (温数据)  │ │ (冷数据)  │ │ (可变元数据) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Layer 0: 网络基础层                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Libp2p / Iroh (Rust)                                │  │
│  │  ├── Kademlia DHT (节点发现)                          │  │
│  │  ├── Gossipsub (广播)                                 │  │
│  │  ├── AutoNAT + Hole Punching (NAT 穿透)              │  │
│  │  └── Yrs CRDT (数据同步)                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、MVP 架构 (简化版)

MVP 阶段采用简化架构，聚焦核心功能验证：

```
┌─────────────────────────────────────────────────────┐
│              MindSpace Desktop (Tauri 2.x)           │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Frontend (React + TypeScript)                │   │
│  │  ├── Canvas Engine (PixiJS 8)                │   │
│  │  ├── Rich Text Editor (TipTap)               │   │
│  │  ├── AI Chat Panel                           │   │
│  │  ├── Sidebar (Nodes, Search, Settings)       │   │
│  │  └── State Management (Zustand)              │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Tauri Bridge (IPC Commands)                 │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Backend (Rust)                              │   │
│  │  ├── Database (rusqlite → SQLite)            │   │
│  │  ├── File Storage (本地文件系统)              │   │
│  │  ├── Crypto Module (ed25519 签名)             │   │
│  │  ├── AI Proxy (reqwest → Claude API)         │   │
│  │  └── Blockchain Client (ethers-rs)           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    Claude API    IPFS Gateway    Arbitrum Sepolia
    (AI 推理)     (内容发布)      (确权上链)
```

---

## 四、核心模块设计

### 4.1 画布引擎 (Canvas Engine)

```
┌─────────────────────────────────────┐
│         Canvas Engine (PixiJS)       │
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Viewport │  │ Node Manager     │ │
│  │ - Zoom   │  │ - Create         │ │
│  │ - Pan    │  │ - Delete         │ │
│  │ - Bounds │  │ - Update         │ │
│  └──────────┘  │ - Select         │ │
│                │ - Hit Test       │ │
│  ┌──────────┐  └──────────────────┘ │
│  │ Renderer │                       │
│  │ - Nodes  │  ┌──────────────────┐ │
│  │ - Edges  │  │ Interaction      │ │
│  │ - Grid   │  │ - Drag & Drop    │ │
│  │ - MiniMap│  │ - Resize         │ │
│  └──────────┘  │ - Connect        │ │
│                │ - Multi-Select   │ │
│                └──────────────────┘ │
└─────────────────────────────────────┘
```

**技术选型: PixiJS 8.x**
- WebGL/WebGPU 渲染，10K+ 对象性能优秀
- 支持容器层级、遮罩、滤镜
- 与 React 集成良好 (@pixi/react)

### 4.2 数据流架构

```
User Action
    │
    ▼
React Component ──→ Zustand Store ──→ UI Update (即时)
    │
    ▼
Tauri Command (IPC)
    │
    ▼
Rust Backend
    ├── SQLite (持久化，防抖 500ms)
    ├── File System (图片/附件)
    └── AI Proxy (异步)
```

### 4.3 AI 集成架构

```
┌─────────────────────────────────────────────┐
│              AI Gateway (Rust)               │
│                                              │
│  ┌────────────┐  ┌────────────────────────┐ │
│  │ Prompt     │  │ Provider Router        │ │
│  │ Manager    │  │                        │ │
│  │ - Personas │  │  ┌──────┐ ┌─────────┐ │ │
│  │ - Templates│  │  │Claude│ │ Ollama  │ │ │
│  │ - Context  │  │  │ API  │ │ (Local) │ │ │
│  │   Builder  │  │  └──────┘ └─────────┘ │ │
│  └────────────┘  └────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Response Handler                       │ │
│  │ - Streaming (SSE)                      │ │
│  │ - Error Handling & Retry               │ │
│  │ - Token Counting                       │ │
│  │ - Cache (Prompt Cache)                 │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 4.4 确权上链流程

```
用户点击"确权"
    │
    ▼
收集画布数据 → 序列化为 JSON
    │
    ▼
SHA-256 哈希计算
    │
    ▼
构建交易 (IdeaRegistry.register(hash, metadata))
    │
    ▼
用户签名 (本地私钥)
    │
    ▼
发送到 Arbitrum Sepolia
    │
    ▼
等待确认 → 更新本地状态 → 显示确权标识
```

---

## 五、目录结构设计

```
Mind/
├── apps/
│   ├── desktop/                    # Tauri 桌面应用
│   │   ├── src-tauri/              # Rust 后端
│   │   │   ├── src/
│   │   │   │   ├── main.rs         # 入口
│   │   │   │   ├── commands/       # Tauri 命令
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── canvas.rs   # 画布数据命令
│   │   │   │   │   ├── ai.rs       # AI 代理命令
│   │   │   │   │   ├── wallet.rs   # 钱包命令
│   │   │   │   │   └── blockchain.rs # 区块链命令
│   │   │   │   ├── db/             # 数据库模块
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── schema.rs   # 表结构定义
│   │   │   │   │   ├── canvas.rs   # 画布 CRUD
│   │   │   │   │   └── node.rs     # 节点 CRUD
│   │   │   │   ├── ai/             # AI 模块
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── gateway.rs  # AI 网关
│   │   │   │   │   ├── prompts.rs  # Prompt 模板
│   │   │   │   │   └── personas.rs # 人格定义
│   │   │   │   ├── crypto/         # 加密模块
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── wallet.rs   # 钱包管理
│   │   │   │   │   └── signing.rs  # 签名
│   │   │   │   ├── storage/        # 存储模块
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── files.rs    # 文件管理
│   │   │   │   │   └── ipfs.rs     # IPFS 客户端
│   │   │   │   └── blockchain/     # 区块链模块
│   │   │   │       ├── mod.rs
│   │   │   │       ├── client.rs   # RPC 客户端
│   │   │   │       └── contracts.rs # 合约交互
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   └── src/                    # React 前端
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       ├── components/
│   │       │   ├── canvas/         # 画布组件
│   │       │   │   ├── Canvas.tsx
│   │       │   │   ├── CanvasEngine.ts
│   │       │   │   ├── NodeRenderer.tsx
│   │       │   │   ├── EdgeRenderer.tsx
│   │       │   │   ├── MiniMap.tsx
│   │       │   │   └── ViewportControls.tsx
│   │       │   ├── nodes/          # 节点类型组件
│   │       │   │   ├── TextNode.tsx
│   │       │   │   ├── ImageNode.tsx
│   │       │   │   ├── LinkNode.tsx
│   │       │   │   └── GroupNode.tsx
│   │       │   ├── ai/             # AI 组件
│   │       │   │   ├── AIChat.tsx
│   │       │   │   ├── PersonaSelector.tsx
│   │       │   │   └── StreamingText.tsx
│   │       │   ├── sidebar/        # 侧边栏
│   │       │   │   ├── NodeList.tsx
│   │       │   │   ├── Search.tsx
│   │       │   │   └── Settings.tsx
│   │       │   └── ui/             # 通用 UI 组件
│   │       │       ├── Button.tsx
│   │       │       ├── Modal.tsx
│   │       │       └── Toast.tsx
│   │       ├── hooks/              # 自定义 Hooks
│   │       │   ├── useCanvas.ts
│   │       │   ├── useAI.ts
│   │       │   ├── useWallet.ts
│   │       │   └── useAutoSave.ts
│   │       ├── stores/             # Zustand 状态
│   │       │   ├── canvasStore.ts
│   │       │   ├── nodeStore.ts
│   │       │   ├── aiStore.ts
│   │       │   └── settingsStore.ts
│   │       ├── lib/                # 工具库
│   │       │   ├── tauri.ts        # Tauri API 封装
│   │       │   ├── markdown.ts     # Markdown 工具
│   │       │   └── geometry.ts     # 几何计算
│   │       └── styles/
│   │           ├── tokens.css      # 设计令牌
│   │           ├── global.css
│   │           └── components.css
│   └── web/                        # Web 轻客户端 (后续)
├── contracts/                      # 智能合约
│   ├── src/
│   │   ├── MIND_Token.sol
│   │   ├── IdeaRegistry.sol
│   │   ├── SparkReward.sol
│   │   └── DAO_Governor.sol
│   ├── test/
│   ├── scripts/
│   ├── hardhat.config.ts
│   └── package.json
├── packages/
│   ├── shared/                     # 共享类型
│   │   ├── src/
│   │   │   ├── types.ts           # 数据类型定义
│   │   │   ├── constants.ts       # 常量
│   │   │   └── utils.ts           # 通用工具
│   │   └── package.json
│   └── ai-gateway/                 # AI 网关 (后续独立)
├── docs/                           # 文档
├── scripts/                        # 构建脚本
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

---

## 六、关键技术决策记录

### ADR-001: 选择 PixiJS 而非 Canvas API / SVG
- **状态**: 已采纳
- **理由**: 10K+ 节点渲染性能、WebGL 加速、成熟的容器系统
- **风险**: 学习曲线、与 DOM 交互需要桥接

### ADR-002: 选择 TipTap 而非 Slate / Quill
- **状态**: 已采纳
- **理由**: ProseMirror 底层强大、Markdown 支持好、扩展性最强
- **风险**: ProseMirror 学习曲线

### ADR-003: MVP 阶段不引入 CRDT
- **状态**: 已采纳
- **理由**: 单设备场景不需要，降低复杂度，后续版本引入 Yrs
- **风险**: 后续迁移需要数据模型调整

### ADR-004: 选择 Claude API 作为主力 AI
- **状态**: 已采纳
- **理由**: 推理能力强、200K 上下文、Prompt 缓存降低成本
- **风险**: API 依赖，需要本地模型作为降级方案

### ADR-005: 选择 Arbitrum 作为 L2
- **状态**: 已采纳
- **理由**: 生态成熟、Gas 低、开发者工具完善
- **备选**: Base (Coinbase 生态优势)
