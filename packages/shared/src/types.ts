// @mind/shared - Core type definitions for Mind platform

// ============ 基础类型 ============
export type UUID = string;
export type UnixTimestamp = number;
export type CID = string;
export type TxHash = string;
export type EthAddress = string;
export type BLAKE3Hash = string;

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
export type NodeType = "text" | "image" | "link" | "group" | "drawing" | "code";

export interface MindNode {
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
  parentId?: UUID;
  metadata?: NodeMetadata;
}

export interface NodeMetadata {
  color?: string;
  locked?: boolean;
  tags?: string[];
  certified?: boolean;
  certTxHash?: TxHash;
}

// ============ 节点内容 ============
export interface TextContent {
  markdown: string;
  style?: TextStyle;
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
}

export interface ImageContent {
  filePath: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface LinkContent {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
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
  role: "user" | "assistant" | "system";
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
  type: "text" | "done" | "error";
  content?: string;
  error?: string;
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
  status: "pending" | "confirmed" | "failed";
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

// ============ 画布运行时状态 ============
export interface CanvasState {
  viewport: Viewport;
  nodes: Map<UUID, MindNode>;
  edges: Map<UUID, Edge>;
  groups: Map<UUID, Group>;
  selectedNodeIds: Set<UUID>;
  selectedEdgeIds: Set<UUID>;
  activeNodeId?: UUID;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

// ============ 搜索 ============
export interface SearchResult {
  nodeId: UUID;
  canvasId: UUID;
  content: string;
  highlight: string;
  score: number;
}
