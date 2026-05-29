# MindSpace 数据模型设计

## 一、设计原则

1. **本地优先**: 所有数据首先存储在本地 SQLite
2. **不可变内容 + 可变引用**: 内容哈希不可变，引用可更新
3. **渐进式上链**: 本地数据 → IPFS → 区块链，按需升级
4. **加密存储**: 敏感数据使用用户密钥加密

---

## 二、SQLite 表结构

### 2.1 核心表

```sql
-- 画布表
CREATE TABLE canvases (
    id          TEXT PRIMARY KEY,        -- UUID
    name        TEXT NOT NULL,
    description TEXT,
    created_at  INTEGER NOT NULL,        -- Unix timestamp (ms)
    updated_at  INTEGER NOT NULL,
    is_deleted  INTEGER DEFAULT 0,       -- 软删除
    metadata    TEXT,                     -- JSON: { tags, color, icon }
    CONSTRAINT canvas_name_not_empty CHECK (length(name) > 0)
);

-- 节点表
CREATE TABLE nodes (
    id          TEXT PRIMARY KEY,        -- UUID
    canvas_id   TEXT NOT NULL,
    type        TEXT NOT NULL,           -- 'text' | 'image' | 'link' | 'group' | 'drawing' | 'code'
    x           REAL NOT NULL,
    y           REAL NOT NULL,
    width       REAL NOT NULL,
    height      REAL NOT NULL,
    z_index     INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    is_deleted  INTEGER DEFAULT 0,
    parent_id   TEXT,                     -- 群组节点的父节点 ID
    metadata    TEXT,                     -- JSON: 扩展属性
    FOREIGN KEY (canvas_id) REFERENCES canvases(id),
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

-- 节点内容表 (分离内容以优化查询)
CREATE TABLE node_contents (
    node_id     TEXT PRIMARY KEY,
    content     TEXT NOT NULL,            -- 实际内容 (Markdown / JSON)
    plain_text  TEXT,                     -- 纯文本 (用于搜索)
    version     INTEGER DEFAULT 1,
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

-- 连接线表
CREATE TABLE edges (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    source_id   TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    label       TEXT,
    style       TEXT,                     -- JSON: { color, width, dashed, arrow }
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id),
    FOREIGN KEY (source_id) REFERENCES nodes(id),
    FOREIGN KEY (target_id) REFERENCES nodes(id)
);

-- 群组表
CREATE TABLE groups (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    name        TEXT,
    color       TEXT,
    is_collapsed INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);

-- 群组-节点关联表
CREATE TABLE group_members (
    group_id    TEXT NOT NULL,
    node_id     TEXT NOT NULL,
    PRIMARY KEY (group_id, node_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

-- 连接线表
CREATE TABLE edges (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    source_id   TEXT NOT NULL,            -- 起始节点 ID
    target_id   TEXT NOT NULL,            -- 目标节点 ID
    label       TEXT,
    style       TEXT,                     -- JSON: { color, width, dashed, arrow }
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id),
    FOREIGN KEY (source_id) REFERENCES nodes(id),
    FOREIGN KEY (target_id) REFERENCES nodes(id)
);
```

### 2.2 AI 相关表

```sql
-- AI 对话历史
CREATE TABLE ai_conversations (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    node_id     TEXT,                     -- 关联节点 (可选)
    persona     TEXT DEFAULT 'default',   -- AI 人格
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id),
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

-- AI 消息
CREATE TABLE ai_messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role            TEXT NOT NULL,        -- 'user' | 'assistant' | 'system'
    content         TEXT NOT NULL,
    created_at      INTEGER NOT NULL,
    tokens_used     INTEGER,
    model           TEXT,                 -- 使用的模型
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id)
);

-- AI 人格定义
CREATE TABLE personas (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    avatar      TEXT,                     -- 头像路径
    is_builtin  INTEGER DEFAULT 1,
    created_at  INTEGER NOT NULL
);
```

### 2.3 身份与确权表

```sql
-- 钱包信息 (加密存储)
CREATE TABLE wallets (
    id          TEXT PRIMARY KEY,
    address     TEXT NOT NULL UNIQUE,
    encrypted_key TEXT NOT NULL,          -- 加密后的私钥
    created_at  INTEGER NOT NULL
);

-- 想法确权记录
CREATE TABLE idea_certifications (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    content_hash TEXT NOT NULL,           -- SHA-256 哈希
    chain_id    INTEGER NOT NULL,         -- 链 ID
    tx_hash     TEXT,                     -- 交易哈希
    block_number INTEGER,
    certified_at INTEGER,
    status      TEXT DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'failed'
    FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);
```

### 2.4 设置表

```sql
-- 应用设置
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  INTEGER NOT NULL
);

-- 书签
CREATE TABLE bookmarks (
    id          TEXT PRIMARY KEY,
    canvas_id   TEXT NOT NULL,
    name        TEXT NOT NULL,
    x           REAL NOT NULL,
    y           REAL NOT NULL,
    zoom        REAL NOT NULL,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);
```

### 2.5 全文搜索

```sql
-- FTS5 虚拟表用于全文搜索
CREATE VIRTUAL TABLE nodes_fts USING fts5(
    node_id,
    plain_text,
    content='node_contents',
    content_rowid='rowid'
);

-- 触发器：自动更新搜索索引
CREATE TRIGGER nodes_fts_insert AFTER INSERT ON node_contents BEGIN
    INSERT INTO nodes_fts(node_id, plain_text) VALUES (new.node_id, new.plain_text);
END;

CREATE TRIGGER nodes_fts_update AFTER UPDATE ON node_contents BEGIN
    DELETE FROM nodes_fts WHERE node_id = old.node_id;
    INSERT INTO nodes_fts(node_id, plain_text) VALUES (new.node_id, new.plain_text);
END;

CREATE TRIGGER nodes_fts_delete AFTER DELETE ON node_contents BEGIN
    DELETE FROM nodes_fts WHERE node_id = old.node_id;
END;
```

---

## 三、TypeScript 类型定义

```typescript
// packages/shared/src/types.ts

// ============ 基础类型 ============

export type UUID = string;
export type UnixTimestamp = number;
export type CID = string;          // IPFS Content Identifier
export type TxHash = string;       // 区块链交易哈希
export type EthAddress = string;   // 以太坊地址

// ============ 画布 ============

export interface Canvas {
  id: UUID;
  name: string;
  description?: string;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
  isDeleted: boolean;
  metadata?: CanvasMetadata;
}

export interface CanvasMetadata {
  tags?: string[];
  color?: string;
  icon?: string;
}

// ============ 节点 ============

export type NodeType = 'text' | 'image' | 'link' | 'group' | 'drawing' | 'code';

export interface Node {
  id: UUID;
  canvasId: UUID;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
  isDeleted: boolean;
  parentId?: UUID;                  // 群组父节点
  metadata?: NodeMetadata;
}

export interface NodeMetadata {
  color?: string;
  locked?: boolean;
  tags?: string[];
}

// ============ 节点内容 ============

export interface TextContent {
  markdown: string;
  style?: TextStyle;
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageContent {
  filePath: string;                 // 本地文件路径
  alt?: string;
  width?: number;
  height?: number;
}

export interface LinkContent {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;               // 缩略图路径
  favicon?: string;
}

export interface CodeContent {
  code: string;
  language: string;
}

// ============ 连接线 ============

export interface Edge {
  id: UUID;
  canvasId: UUID;
  sourceId: UUID;
  targetId: UUID;
  label?: string;
  style?: EdgeStyle;
  createdAt: UnixTimestamp;
}

export interface EdgeStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
  arrow?: boolean;
}

// ============ 群组 ============

export interface Group {
  id: UUID;
  canvasId: UUID;
  name?: string;
  color?: string;
  isCollapsed: boolean;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
}

// ============ AI ============

export interface AIConversation {
  id: UUID;
  canvasId: UUID;
  nodeId?: UUID;
  persona: string;
  createdAt: UnixTimestamp;
}

export interface AIMessage {
  id: UUID;
  conversationId: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: UnixTimestamp;
  tokensUsed?: number;
  model?: string;
}

export interface Persona {
  id: UUID;
  name: string;
  displayName: string;
  description?: string;
  systemPrompt: string;
  avatar?: string;
  isBuiltin: boolean;
}

// ============ 钱包与确权 ============

export interface Wallet {
  id: UUID;
  address: EthAddress;
  createdAt: UnixTimestamp;
}

export interface IdeaCertification {
  id: UUID;
  canvasId: UUID;
  contentHash: string;
  chainId: number;
  txHash?: TxHash;
  blockNumber?: number;
  certifiedAt?: UnixTimestamp;
  status: 'pending' | 'confirmed' | 'failed';
}

// ============ 书签 ============

export interface Bookmark {
  id: UUID;
  canvasId: UUID;
  name: string;
  x: number;
  y: number;
  zoom: number;
  createdAt: UnixTimestamp;
}

// ============ 画布状态 (运行时) ============

export interface CanvasState {
  viewport: Viewport;
  nodes: Map<UUID, Node>;
  edges: Map<UUID, Edge>;
  groups: Map<UUID, Group>;
  selectedNodeIds: Set<UUID>;
  selectedEdgeIds: Set<UUID>;
  activeNodeId?: UUID;              // 当前编辑的节点
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

// ============ AI 请求/响应 ============

export interface AIRequest {
  conversationId?: UUID;
  nodeId?: UUID;
  message: string;
  persona?: string;
  context?: AIContext;
}

export interface AIContext {
  currentNode?: { id: UUID; content: string };
  surroundingNodes?: Array<{ id: UUID; content: string }>;
  canvasName?: string;
}

export interface AIStreamChunk {
  type: 'text' | 'done' | 'error';
  content?: string;
  error?: string;
}
```

---

## 四、数据迁移策略

### 版本管理

```rust
// src-tauri/src/db/schema.rs

const MIGRATIONS: &[&str] = &[
    // V1: 初始表结构
    include_str!("migrations/001_initial.sql"),
    // V2: 添加 FTS 索引
    include_str!("migrations/002_fts.sql"),
    // V3: 添加 AI 表
    include_str!("migrations/003_ai_tables.sql"),
];

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)")?;
    
    let current_version: i32 = conn
        .query_row("SELECT COALESCE(MAX(version), 0) FROM _migrations", [], |row| row.get(0))?;
    
    for (i, migration) in MIGRATIONS.iter().enumerate() {
        let version = (i + 1) as i32;
        if version > current_version {
            conn.execute_batch(migration)?;
            conn.execute("INSERT INTO _migrations (version) VALUES (?1)", [version])?;
        }
    }
    
    Ok(())
}
```

---

## 五、文件存储结构

```
~/.mind/
├── mind.db                         # SQLite 数据库
├── wallet.enc                      # 加密的钱包文件
├── canvases/
│   ├── {canvas-id}/
│   │   ├── images/
│   │   │   ├── {image-hash}.png
│   │   │   └── {image-hash}.jpg
│   │   ├── thumbnails/
│   │   │   └── {link-hash}.jpg
│   │   └── exports/
│   │       └── {timestamp}.json    # 导出文件
├── settings/
│   └── app.json                    # 应用设置
└── logs/
    └── app.log                     # 日志文件
```
