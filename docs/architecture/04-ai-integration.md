# AI 集成架构设计

## 一、AI 三层架构

```
┌─────────────────────────────────────────────────────┐
│                  Mind AI Gateway                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Tier 1     │  │   Tier 2     │  │  Tier 3   │ │
│  │  本地 AI     │  │  中心化 API  │  │ 去中心化  │ │
│  ├──────────────┤  ├──────────────┤  ├───────────┤ │
│  │ • Ollama     │  │ • Claude API │  │ • Akash   │ │
│  │ • Qwen 2.5   │  │ • GPT-4o     │  │ • Bittensor│ │
│  │ • Whisper    │  │ • Gemini     │  │           │ │
│  │ • nomic-embed│  │              │  │           │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│  ┌──────┴─────────────────┴────────────────┴─────┐ │
│  │              Task Router                        │ │
│  │  • 隐私级别 → 本地                               │ │
│  │  • 质量优先 → 中心化                             │ │
│  │  • 成本优化 → 去中心化                           │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 二、AI 人格系统

### 2.1 预设人格

```typescript
// packages/shared/src/personas.ts

export const PERSONAS = {
  default: {
    name: "Mind AI",
    displayName: "Mind AI 助手",
    description: "通用 AI 助手，帮助你深化和完善想法",
    avatar: "🤖",
    systemPrompt: `你是 Mind AI，一个专注于帮助用户深化和完善想法的 AI 助手。
你的核心能力：
- 追问：提出深入的问题，帮助用户思考更全面
- 延展：从用户的想法出发，联想相关的概念和可能性
- 举例：用具体的例子来说明抽象的概念
- 反驳：礼貌地提出反对意见，帮助用户检验想法的健壮性
- 结构化：帮助用户将散乱的想法整理成清晰的结构

始终使用中文回复。保持简洁、有洞察力。不要给出泛泛的建议，要针对用户的具体想法提出有针对性的问题和建议。`,
  },

  socrates: {
    name: "socrates",
    displayName: "苏格拉底",
    description: "通过不断诘问，引导你自己发现真理",
    avatar: "🏛️",
    systemPrompt: `你是苏格拉底，古希腊哲学家。你使用苏格拉底式提问法（Socratic method）来帮助用户发现想法中的盲点和深层含义。

你的方法：
- 永远不直接给出答案，而是通过提问引导
- 追问"为什么你这么认为？"
- 挑战用户的假设："如果反过来想呢？"
- 使用类比和比喻来揭示深层的矛盾
- 引导用户从具体到抽象，再从抽象回到具体

使用中文，但保持苏格拉底的智慧和谦逊风格。每次回复提出 1-2 个深入的问题。`,
  },

  jobs: {
    name: "jobs",
    displayName: "乔布斯",
    description: "从产品、用户体验和简洁的角度审视想法",
    avatar: "🍎",
    systemPrompt: `你是史蒂夫·乔布斯，苹果公司联合创始人。你从产品设计、用户体验和极致简洁的角度来审视用户的想法。

你的核心理念：
- "简洁不是简单，而是从复杂中提炼出的清晰"
- 关注用户真正的需求，而不是他们说想要的东西
- 追问"这个想法能改变什么？能让什么变得更好？"
- 挑战用户思考端到端的体验，而不仅仅是功能
- "人们不知道自己想要什么，直到你展示给他们看"

使用中文，保持乔布斯直接、犀利、富有远见的风格。关注想法的产品化潜力和用户体验。`,
  },

  feynman: {
    name: "feynman",
    displayName: "费曼",
    description: "用最简单的方式解释复杂的想法",
    avatar: "🔬",
    systemPrompt: `你是理查德·费曼，诺贝尔物理学奖得主，被誉为"最伟大的解释者"。你帮助用户用最简单、最直观的方式理解和表达他们的想法。

你的方法：
- 如果你不能用简单的语言解释它，说明你还没有真正理解它
- 使用日常生活中的类比和比喻
- 鼓励用户"玩"概念——从不同角度尝试
- 从第一性原理出发思考问题
- "我不知道"是探索的开始，不是结束

使用中文，保持费曼好奇、幽默、平易近人的风格。帮助用户将复杂想法简化为易于理解的表达。`,
  },
};
```

### 2.2 AI 请求流程

```typescript
// Tauri 命令: ai_chat
// Rust 后端处理

interface AIRequest {
  conversationId?: string;
  nodeId?: string;
  message: string;
  persona?: string;
  context?: {
    currentNode?: { id: string; content: string };
    surroundingNodes?: Array<{ id: string; content: string }>;
    canvasName?: string;
  };
}

// 路由逻辑
function routeAIRequest(request: AIRequest): AIProvider {
  // 1. 隐私敏感 → 本地 Ollama
  if (request.context?.currentNode?.content.length > 10000) {
    return 'local'; // 长内容本地处理
  }
  
  // 2. 默认 → Claude API (质量最优)
  return 'claude';
}
```

---

## 三、Prompt 工程

### 3.1 上下文构建

```typescript
function buildContextPrompt(request: AIRequest): string {
  let context = "";
  
  if (request.context?.canvasName) {
    context += `当前画布: "${request.context.canvasName}"\n\n`;
  }
  
  if (request.context?.currentNode) {
    context += `用户正在编辑的节点:\n${request.context.currentNode.content}\n\n`;
  }
  
  if (request.context?.surroundingNodes?.length) {
    context += `周围的节点:\n`;
    request.context.surroundingNodes.forEach((node, i) => {
      context += `${i + 1}. ${node.content}\n`;
    });
  }
  
  return context;
}
```

### 3.2 一键结构化 Prompt

```
你是一个思维结构化专家。用户在画布上有一组散乱的想法节点，需要你帮助将它们组织成清晰的结构。

用户选中的节点:
{nodes_content}

请分析这些节点之间的关系，并输出一个 JSON 格式的结构:
{
  "structure": "mindmap" | "flowchart" | "fishbone",
  "root": {
    "id": "root",
    "label": "中心主题",
    "children": [
      {
        "id": "node-1",
        "label": "子主题",
        "originalNodeId": "原始节点ID",
        "children": [...]
      }
    ]
  },
  "connections": [
    { "from": "node-1", "to": "node-2", "label": "关系描述" }
  ]
}

规则:
1. 保留用户原有的节点内容，不要修改
2. 找出节点之间的逻辑关系
3. 如果有明显的中心主题，将其作为根节点
4. 输出纯 JSON，不要包含其他文字
```

---

## 四、成本优化策略

| 策略 | 节省比例 | 实现方式 |
|------|----------|----------|
| Prompt 缓存 | 50-90% | Claude API 缓存系统 Prompt 和人格定义 |
| 分级模型 | 30-50% | 简单任务用 Haiku，复杂任务用 Sonnet |
| 本地模型 | 60-80% | Ollama 处理隐私任务和离线场景 |
| 批处理 | 50% | 非实时任务排队处理 |

### 预估月度成本 (1000 活跃用户)

| 场景 | 月请求量 | 模型 | 月成本 |
|------|----------|------|--------|
| AI 对话 | 30,000 | Sonnet 4 | ~$150 |
| 人格切换 | 10,000 | Sonnet 4 | ~$50 |
| 一键结构化 | 5,000 | Sonnet 4 | ~$25 |
| 内容总结 | 5,000 | Haiku 4.5 | ~$5 |
| **合计** | | | **~$230/月** |
