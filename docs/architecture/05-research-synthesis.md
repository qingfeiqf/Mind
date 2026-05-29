# 技术研究综合报告与架构推荐

> 基于 4 个并行研究代理的深度调研，覆盖区块链架构、开源竞品、P2P/CRDT、AI 集成四大维度。

---

## 一、关键发现摘要

### 1.1 区块链架构 (关键调整)

| 决策 | 原方案 | 研究推荐 | 理由 |
|------|--------|----------|------|
| **L2 网络** | Arbitrum | **Base (OP Stack)** | 消费级/社交应用生态最强 (Farcaster/Zora)，Coinbase 法币入口 |
| **用户上链** | 钱包导入 | **Privy + Alchemy Account Kit** | 邮箱/社交登录，用户无需理解区块链 |
| **想法代币** | ERC-721 | **ERC-721 + ERC-6551 (TBA)** | 想法拥有自己的钱包，可累积价值 |
| **声誉系统** | 自建 | **Soulbound Token (ERC-5192)** | 不可转让的声誉凭证 |
| **治理** | 自建三权分立 | **Snapshot + Safe → 双院制** | 渐进式去中心化，防止财阀控制 |
| **确权存储** | IPFS | **Arweave (永久) + IPFS (灵活)** | 想法永久保存，不依赖 Pin 服务 |

### 1.2 P2P 与 CRDT (重大发现)

| 决策 | 原方案 | 研究推荐 | 理由 |
|------|--------|----------|------|
| **CRDT 引擎** | Yjs/Yrs | **Loro v1.0** | MovableTree 天然适合画布树结构，Fugue 算法性能最优 |
| **P2P 网络** | Libp2p | **Iroh** | Rust 原生、QUIC 传输、API 更简单、内置 NAT 穿透 |
| **内容存储** | IPFS | **Iroh/blobs** | BLAKE3 内容寻址，与 Iroh 网络无缝集成 |
| **本地数据库** | SQLite only | **SQLite + redb** | SQLite 存元数据/搜索，redb 存 CRDT 快照/缓存 |
| **画布引擎** | PixiJS | **tldraw (评估中)** | 开源画布框架，Apache 2.0，可直接嵌入 React |

### 1.3 开源竞品 (可复用项目)

| 项目 | Stars | 可用性 | Mind 用途 |
|------|-------|--------|-----------|
| **tldraw** | 37K+ | 直接嵌入 (Apache 2.0) | 画布/思维导图引擎 |
| **AFFiNE/BlockSuite** | 40K+ | 参考架构 | 块编辑器、文档+画布统一 |
| **Excalidraw** | 90K+ | 嵌入 (MIT) | 快速草图/头脑风暴模式 |
| **Yjs** | 17K+ | 备选 CRDT | 如果 Loro 不够成熟时的备选 |
| **Farcaster Hub** | 2.5K+ | 研究协议 | MindWorld 社交架构参考 |
| **Bluesky/AT Protocol** | 16K+ | 研究 Lexicon | 内容类型定义参考 |
| **Juicebox** | - | 合约参考 | DreamMore 众筹机制 |

### 1.4 AI 集成 (三层架构)

| 层级 | 技术 | 用途 |
|------|------|------|
| **Tier 1: 本地 AI** | Ollama + Qwen 2.5 7B | 隐私敏感任务、离线可用 |
| **Tier 2: 中心化 API** | Claude Sonnet 4 | 高质量推理、人格对话 |
| **Tier 3: 去中心化** | Akash Network | 批量处理、成本优化 |

---

## 二、最终推荐技术栈

### 桌面应用 (MindSpace)

```
┌─────────────────────────────────────────────────┐
│              Tauri 2.x (Rust + React/TS)         │
├─────────────────────────────────────────────────┤
│  Frontend                                        │
│  ├── 画布: tldraw (评估) 或 PixiJS 8            │
│  ├── 编辑器: TipTap (ProseMirror)               │
│  ├── 状态: Zustand                              │
│  ├── 样式: Tailwind CSS 4                       │
│  └── 构建: Vite 6                               │
├─────────────────────────────────────────────────┤
│  Rust Backend                                    │
│  ├── CRDT: Loro v1.0 (MovableTree + Fugue)     │
│  ├── P2P: Iroh (QUIC, NAT 穿透)                │
│  ├── 存储: rusqlite + redb                      │
│  ├── 加密: ring + ed25519-dalek                 │
│  └── HTTP: reqwest                              │
├─────────────────────────────────────────────────┤
│  External                                        │
│  ├── AI: Claude API + Ollama (本地)             │
│  ├── 存储: Iroh/blobs + Arweave                 │
│  └── 链: Base (OP Stack L2) 或 Arbitrum Sepolia │
└─────────────────────────────────────────────────┘
```

### 智能合约

```
Base L2 (或 Arbitrum)
├── IdeaRegistry.sol     (想法确权)
├── MIND_Token.sol       (ERC-20 治理代币)
├── IdeaToken.sol        (ERC-721 + ERC-6551)
├── SparkReward.sol      (积分系统)
├── ReputationSBT.sol    (ERC-5192 声誉)
└── MindGovernor.sol     (DAO 治理)
```

---

## 三、实施路线图

```
Phase 0: MVP (16 周)
├── Sprint 0 (4w): 技术 POC 验证
├── Sprint 1 (4w): 画布核心 + 富文本
├── Sprint 2 (4w): AI 集成 + 多内容类型
└── Sprint 3 (4w): 身份确权 + Alpha 发布

Phase 1: 增长 (12 周)
├── P2P 同步 (Loro + Iroh)
├── 历史版本 (Loro Time Travel)
├── 更多节点类型 (涂鸦/代码)
└── 发布到 MindWorld

Phase 2: 生态 (12 周)
├── MindWorld 社交广场
├── SPARK 积分系统
├── 协作编辑 (多人实时)
└── 代币经济启动

Phase 3: 规模化 (长期)
├── DreamMore 众筹
├── 去中心化 AI (Bittensor)
├── DAO 治理全面启动
└── 第三方客户端生态
```

---

## 四、风险与缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|----------|
| Loro CRDT 不够成熟 | 中 | 高 | Yjs/Yrs 作为备选，抽象 CRDT 接口 |
| tldraw 定制化困难 | 中 | 中 | 退回 PixiJS 方案，已有 POC |
| Base L2 监管风险 | 低 | 高 | 保持 Arbitrum 作为备选 |
| AI API 成本过高 | 中 | 中 | 本地模型 (Ollama) 降级 + Prompt 缓存 |
| 冷启动用户不足 | 高 | 高 | 工具先行策略，先提供独立价值 |

---

## 五、开源项目 GitHub 链接汇总

### 直接可用 (嵌入/集成)
- tldraw: `github.com/tldraw/tldraw`
- Excalidraw: `github.com/excalidraw/excalidraw`
- Yjs: `github.com/yjs/yjs`
- TipTap: `github.com/ueberdosis/tiptap`

### 核心依赖 (Rust)
- Loro: `github.com/loro-dev/loro`
- Iroh: `github.com/n0-computer/iroh`
- redb: `github.com/cberner/redb`

### 参考架构
- AFFiNE/BlockSuite: `github.com/toeverything/AFFiNE`
- Farcaster: `github.com/farcasterxyz/hub`
- AT Protocol: `github.com/bluesky-social/atproto`
- Lens Protocol: `github.com/lens-protocol`
- Juicebox: `github.com/jbx-protocol`

### AI 相关
- Bittensor: `github.com/opentensor/bittensor`
- Ollama: `github.com/ollama/ollama`
