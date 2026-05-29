# Mind - 去中心化创想价值网络

> 让每一个有价值的想法都能被记录、分享、协作实现并产生价值。
> Minds make the world a better place.

## 项目概述

Mind 是一个基于区块链的去中心化平台，致力于构建从想法记录到价值实现的完整生态闭环。通过 AI 赋能和代币经济激励，让每个创想者的想法都能获得应有的认可与回报。

## 核心模块

| 模块 | 定位 | 状态 |
|------|------|------|
| **MindSpace** (记写) | AI 驱动的无限画布创想空间 | MVP 开发中 |
| **MindWorld** (思享) | 去中心化想法社交广场 | 规划中 |
| **MindHands** (协作) | 基于想法的远程协作平台 | 规划中 |
| **DreamMore** (追梦) | 想法众筹与孵化 | 规划中 |
| **B-T/C** (书茶咖) | 线下学思行空间 | 规划中 |

## 技术栈

- **桌面客户端**: Tauri 2.x (Rust + React/TypeScript)
- **画布渲染**: PixiJS 8.x / Konva.js
- **P2P 网络**: rust-libp2p / Iroh
- **数据同步**: Yrs (Yjs Rust 移植版) CRDT
- **本地存储**: SQLite (rusqlite)
- **去中心化存储**: IPFS + Arweave
- **区块链**: Ethereum L2 (Arbitrum/Base)
- **智能合约**: Solidity + OpenZeppelin
- **AI**: Claude API + 本地小模型 (Ollama)

## 目录结构

```
Mind/
├── docs/                    # 项目文档
│   ├── product/             # 产品文档 (PRD, 用户故事)
│   ├── architecture/        # 技术架构文档
│   ├── design/              # 设计规范
│   └── sprints/             # 迭代计划
├── apps/
│   ├── desktop/             # Tauri 桌面应用 (MindSpace)
│   ├── web/                 # Web 轻客户端 (MindWorld)
│   ├── contracts/           # 智能合约 (Solidity)
│   └── services/            # 后端服务 (AI Gateway 等)
├── packages/
│   ├── shared/              # 共享类型和工具
│   ├── crdt/                # CRDT 数据模型
│   ├── ai-gateway/          # AI 网关
│   └── p2p/                 # P2P 网络层
├── scripts/                 # 构建和部署脚本
├── tools/                   # 开发工具
└── .github/                 # CI/CD
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动桌面应用开发
pnpm dev:desktop

# 启动 Web 开发
pnpm dev:web

# 运行测试
pnpm test

# 部署智能合约
pnpm deploy:contracts
```

## 文档索引

- [产品愿景与战略](docs/product/01-vision-strategy.md)
- [MVP 范围定义](docs/product/02-mvp-scope.md)
- [用户故事地图](docs/product/03-user-stories.md)
- [技术架构设计](docs/architecture/01-system-architecture.md)
- [数据模型设计](docs/architecture/02-data-model.md)
- [智能合约设计](docs/architecture/03-smart-contracts.md)
- [AI 集成架构](docs/architecture/04-ai-integration.md)
- [设计规范](docs/design/01-design-system.md)
- [Sprint 0 计划](docs/sprints/sprint-0-prototype.md)
- [Sprint 1 计划](docs/sprints/sprint-1-mvp-core.md)

## 许可证

MIT License
