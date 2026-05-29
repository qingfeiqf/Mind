# Farcaster 协议深度分析报告

> 为 Mind 项目 MindWorld 社交模块提供的 Farcaster 协议详细参考。

---

## 一、协议哲学

Farcaster 明确拒绝完全去中心化，采用"充分去中心化"策略：

> "it is far easier to add features to a decentralized network than it is to try and decentralize a feature-rich network."

---

## 二、协议分层

### 链上 (Optimism/Base)
| 合约 | 地址 | 功能 |
|------|------|------|
| IdRegistry | `0x00000000Fc6c5F01Fc30151999387Bb99A9f489b` | FID 注册 |
| KeyRegistry | `0x00000000Fc1237824fb747aBDE0FF18990E59b7e` | 签名密钥管理 |
| StorageRegistry | `0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D` | 存储分配与租赁 |

### 链下 (Hub/Snapchain)
- 所有社交数据 (casts, reactions, follows, verifications)
- 消息传播与复制
- 内容索引与检索

---

## 三、Hub 系统架构

### 技术栈
| 组件 | 技术 |
|------|------|
| 核心 | TypeScript/Node.js (Hubble) |
| 数据格式 | Protocol Buffers (proto3, ts-proto@v1.146.0) |
| P2P | libp2p@0.42.2 gossipsub |
| 存储 | RocksDB |
| 同步 | Merkle Patricia Trie + Diff Sync |
| API | gRPC |

### 消息格式
```
Message {
  data: MessageData
  hash: BLAKE3 160-bit digest
  hash_scheme: HASH_SCHEME_BLAKE3
  signature: Ed25519 或 EIP-712
  signer: public key 或 ETH address
}
```

### 消息类型

| ID | 类型 | 详情 |
|----|------|------|
| 1 | CAST_ADD | 公开消息, ≤1024B UTF-8, ≤10 提及, ≤2 嵌入 |
| 2 | CAST_REMOVE | 按哈希删除 cast |
| 3 | REACTION_ADD | Like/Recast |
| 4 | REACTION_REMOVE | 移除反应 |
| 5 | LINK_ADD | 用户关系 (follow), type ≤8B |
| 6 | LINK_REMOVE | 移除关系 |
| 7 | VERIFICATION_ADD_ETH_ADDRESS | ETH 地址所有权证明 (EIP-712) |
| 8 | VERIFICATION_REMOVE | 移除验证 |
| 11 | USER_DATA_ADD | 个人资料 (PFP, 昵称, bio, URL, 用户名) |
| 12 | USERNAME_PROOF | FNAME 或 ENS 名称证明 |

### 同步 ID 结构 (36 字节)
```
[10B timestamp][1B message_type][4B fid][1B crdt_type][20B hash]
```

### 冲突解决
Delta-state CRDT, last-write-wins:
1. 更高时间戳优先
2. 哈希值字典序决胜

### 存储限制 (每存储单元)

| CRDT | 消息上限 |
|------|----------|
| Cast | 5,000 |
| Reaction | 2,500 |
| Link (Follow) | 2,500 |
| UserData | 50 |
| Verification | 25 |
| UsernameProof | 5 |

---

## 四、Snapchain (下一代架构)

### 迁移原因
1. 无全局真相源——4000 节点 × 1.5 亿消息无法完全协调
2. 无法全局限速
3. 裁剪复杂
4. 单向同步慢

### 架构设计
- **共识:** Tendermint 委员会验证
- **分片:** N 段 + 1 主链 (NEAR Nightshade 启发)
- **账户级分片:** 同账户交易同分片处理
- **验证者:** 每分片至少 4 个, 纪元块调度轮换
- **可用性:** 纠删码分布账户状态
- **目标:** >9,000 TPS, ~200 万日活

### 状态管理
- **状态租赁:** 按年付费 (500 tx/h, 10,000 tx 存储/单元)
- **裁剪:** 非纪元块一周后可裁剪
- **快照:** 每日公开快照, 区块签名+全局根防篡改

---

## 五、身份系统

### FID (Farcaster ID)
- 数字标识符, "cheap, meaningless, and in unlimited supply"
- 通过 Optimism/Base 上的智能合约注册
- 拥有 custody address (ETH 地址)

### 签名密钥
- Ed25519 密钥对, 由 custody address 授权
- 应用使用签名密钥代替用户签名消息
- 用户可随时撤销签名密钥

### 委托签名者
- 应用创建密钥对, 用户签名授权
- 授予消息签名能力, 不授予身份控制权

### 人类可读名称
- FNAME: `/^[a-z0-9][a-z0-9-]{0,15}$/`
- 28 天冷却期
- 支持 ENS 名称

---

## 六、Mini Apps (原 Frames v2)

### 架构
- 完整 Web 应用 (HTML/CSS/JS)
- 在 Farcaster 客户端内渲染
- Manifest (身份文档) + Embed (社交分享元数据)

### SDK 能力
| 能力 | API |
|------|-----|
| 认证 | Sign In with Farcaster (SIWF), Quick Auth (JWT) |
| 钱包 | 原生 ETH/Solana 钱包, 无选择对话框 |
| 社交 | composeCast, viewCast, viewProfile, addMiniApp |
| 代币 | sendToken, swapToken |
| 通知 | 推送通知 |
| 导航 | openMiniApp, back |
| 分享 | Share sheet 集成 |

### SDK
- `@farcaster/frame-sdk` (MIT, 203 stars, 559 forks)
- `@farcaster/hub-nodejs` (服务端)
- `@farcaster/hub-web` (浏览器端)
- `@farcaster/core` (共享)

---

## 七、Channels

- 链上创建 (Optimism/Base), 无许可
- 唯一 ID (如 `/base`, `/design`)
- 关联链上合约地址定义所有权
- 支持链上门控 (NFT/代币持有要求)
- 频道数据存储在 Hub/Snapchain 网络
- 管理委托给频道所有者/运营者

---

## 八、业务模型

### 用户数据
- 注册账户: 600K+ (2025 初)
- 日活: 20K-50K 基线, Frames 发布时峰值 100K+
- 增长驱动: Frames (2024.1) 是最大催化剂

### 收入模型
1. 存储费 (协议级, Sybil 抗性)
2. Warpcast 客户端高级功能
3. Mini App 交易费 (Base/Optimism)

---

## 九、对 Mind 的深度分析

### 不能基于 Farcaster 构建 MindWorld 的原因

| 限制 | 影响 | 严重程度 |
|------|------|----------|
| Cast 1024B 限制 | 想法内容远超此限制 | 致命 |
| 无"想法"实体 | 协议只有 cast/reaction/link/verification | 致命 |
| 存储裁剪 | 想法是永久 IP, 不能被驱逐 | 致命 |
| 无 IP 原语 | 无所有权/授权/衍生追踪 | 严重 |
| 账户隔离 | Snapchain 要求, 会破坏协作编辑 | 严重 |
| 内容模型固定 | 无法添加新消息类型 | 严重 |

### 应该与 Farcaster 集成的方式

1. **Mini App 分发:** 构建 MindWorld Mini App, 让 Farcaster 用户在 feed 中浏览想法
2. **SIWF 认证:** 作为登录选项之一
3. **Cross-posting:** 想法里程碑自动 cast 到 Farcaster
4. **身份桥接:** FID ↔ Mind 身份, 声誉可移植
5. **社交发现:** 利用 Farcaster 社交图谱做想法推荐

### Farcaster vs Lens vs Bluesky 对 Mind 的适用性

| 维度 | Farcaster | Lens V2 | Bluesky |
|------|-----------|---------|---------|
| 想法所有权 | 不支持 | NFT 化 (最佳) | DID (中等) |
| 社交图谱 | 移植可用 | NFT follows (最强) | PDS 存储 |
| 内容容量 | 1024B (太小) | 无硬限制 | 300 graphemes |
| IP 原语 | 无 | Open Actions | 无 |
| 消费者 UX | 最好 (Warpcast) | 中等 | 好 |
| 开发者体验 | 最好 (Mini Apps) | 好 | 增长中 |

**结论:** Mind 应自建协议, Lens 社交图谱集成, Farcaster Mini App 分发。
