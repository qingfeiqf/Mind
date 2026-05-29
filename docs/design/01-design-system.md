# MindSpace 设计规范

## 一、设计哲学

### 核心理念
> "深邃的宇宙，闪烁的灵感。"

MindSpace 的视觉设计旨在创造一个**沉浸式的思考空间**，让用户感觉像是在宇宙中探索自己的想法。每个想法都是一颗星星，连接它们形成星座，AI 则是引导探索的光芒。

### 设计原则
1. **沉浸**: 深色主题营造专注的思考环境
2. **层次**: 通过明暗、大小、颜色建立清晰的信息层次
3. **呼吸**: 适度的动效让界面有生命力，但不喧宾夺主
4. **克制**: 界面元素极简，让内容本身成为焦点

---

## 二、色彩系统

### 2.1 主色调 (深色主题)

```css
:root {
  /* === 背景 === */
  --color-bg-deep: oklch(10% 0.02 260);        /* 最深背景 - 画布 */
  --color-bg-base: oklch(14% 0.02 260);         /* 基础背景 */
  --color-bg-surface: oklch(18% 0.02 260);      /* 表面背景 */
  --color-bg-elevated: oklch(22% 0.02 260);     /* 抬升表面 */
  --color-bg-overlay: oklch(26% 0.02 260);      /* 覆盖层 */
  
  /* === 文字 === */
  --color-text-primary: oklch(95% 0.01 260);    /* 主要文字 */
  --color-text-secondary: oklch(72% 0.02 260);  /* 次要文字 */
  --color-text-tertiary: oklch(55% 0.02 260);   /* 辅助文字 */
  --color-text-disabled: oklch(40% 0.01 260);   /* 禁用文字 */
  
  /* === 强调色 - 灵感之光 === */
  --color-accent-primary: oklch(72% 0.18 195);  /* 青色 - 主强调 */
  --color-accent-secondary: oklch(75% 0.15 65); /* 金色 - 次强调 */
  --color-accent-tertiary: oklch(68% 0.20 290); /* 紫色 - AI 相关 */
  
  /* === 语义色 === */
  --color-success: oklch(72% 0.18 145);         /* 成功/确认 */
  --color-warning: oklch(80% 0.16 80);          /* 警告 */
  --color-error: oklch(65% 0.22 25);            /* 错误 */
  --color-info: oklch(70% 0.15 240);            /* 信息 */
  
  /* === 节点颜色 === */
  --color-node-default: oklch(25% 0.03 260);    /* 默认节点背景 */
  --color-node-hover: oklch(30% 0.04 260);      /* 悬停状态 */
  --color-node-selected: oklch(35% 0.08 195);   /* 选中状态 */
  --color-node-border: oklch(40% 0.04 260);     /* 节点边框 */
  
  /* === 连接线 === */
  --color-edge-default: oklch(45% 0.05 260);    /* 默认连接线 */
  --color-edge-hover: oklch(60% 0.10 195);      /* 悬停连接线 */
  --color-edge-ai: oklch(68% 0.20 290);         /* AI 生成的连接线 */
  
  /* === AI 相关 === */
  --color-ai-glow: oklch(68% 0.20 290);         /* AI 光晕 */
  --color-ai-bubble: oklch(20% 0.05 290);       /* AI 气泡背景 */
  --color-ai-border: oklch(40% 0.12 290);       /* AI 边框 */
}
```

### 2.2 浅色主题

```css
:root[data-theme="light"] {
  --color-bg-deep: oklch(98% 0.005 260);
  --color-bg-base: oklch(96% 0.005 260);
  --color-bg-surface: oklch(100% 0 0);
  --color-bg-elevated: oklch(100% 0 0);
  --color-bg-overlay: oklch(94% 0.01 260);
  
  --color-text-primary: oklch(15% 0.02 260);
  --color-text-secondary: oklch(40% 0.02 260);
  --color-text-tertiary: oklch(55% 0.02 260);
  --color-text-disabled: oklch(70% 0.01 260);
  
  --color-accent-primary: oklch(55% 0.20 195);
  --color-accent-secondary: oklch(58% 0.18 65);
  --color-accent-tertiary: oklch(50% 0.22 290);
}
```

---

## 三、字体系统

```css
:root {
  /* === 字体族 === */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  --font-display: 'Cabinet Grotesk', 'Inter', sans-serif;
  
  /* === 字号 (响应式) === */
  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
  --text-lg: clamp(1.05rem, 0.95rem + 0.5vw, 1.125rem);
  --text-xl: clamp(1.2rem, 1rem + 1vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --text-hero: clamp(2.5rem, 1.5rem + 5vw, 5rem);
  
  /* === 行高 === */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* === 字重 === */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

---

## 四、间距与圆角

```css
:root {
  /* === 间距 === */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  
  /* === 圆角 === */
  --radius-sm: 0.375rem;  /* 6px - 小组件 */
  --radius-md: 0.5rem;    /* 8px - 节点 */
  --radius-lg: 0.75rem;   /* 12px - 卡片 */
  --radius-xl: 1rem;      /* 16px - 面板 */
  --radius-full: 9999px;  /* 圆形 */
  
  /* === 阴影 === */
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.1);
  --shadow-md: 0 4px 6px oklch(0% 0 0 / 0.15);
  --shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.2);
  --shadow-glow: 0 0 20px oklch(68% 0.20 290 / 0.3);  /* AI 光晕 */
}
```

---

## 五、动效系统

```css
:root {
  /* === 时长 === */
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
  
  /* === 缓动 === */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* === Z 轴层级 === */
  --z-canvas: 0;
  --z-nodes: 10;
  --z-edges: 5;
  --z-selection: 20;
  --z-minimap: 50;
  --z-toolbar: 100;
  --z-sidebar: 200;
  --z-ai-bubble: 300;
  --z-modal: 500;
  --z-toast: 600;
}
```

---

## 六、组件规范

### 6.1 节点 (Node)

```
┌─────────────────────────────┐
│ ● ─────────────── ─── ───   │  ← 标题栏 (可拖拽)
├─────────────────────────────┤
│                              │
│  节点内容区域                 │
│  支持 Markdown 渲染          │
│                              │
│                              │
└─────────────────────────────┘
     ↑ 连接点 (四个方向)
```

- 背景: `var(--color-node-default)`
- 边框: 1px solid `var(--color-node-border)`
- 圆角: `var(--radius-md)`
- 最小尺寸: 200×100px
- 最大尺寸: 800×600px
- 拖拽: 整个标题栏可拖拽

### 6.2 AI 气泡

```
     ╭──────────────────────╮
     │  🤖 AI 回复内容      │
     │                      │
     │  流式逐字显示...      │
     │                      │
     ╰──────────────────────╯
           ↗ 关联到节点
```

- 背景: `var(--color-ai-bubble)` + 毛玻璃效果
- 边框: 1px solid `var(--color-ai-border)`
- 发光: `var(--shadow-glow)`
- 出现动画: 淡入 + 轻微上浮 (300ms, ease-out-expo)

### 6.3 工具栏

```
┌─────┬─────┬─────┬─────┬─────┐
│  T  │  🖼 │  🔗 │  🔍 │  📍 │
│ 文本 │ 图片 │ 链接 │ 搜索 │ 书签 │
└─────┴─────┴─────┴─────┴─────┘
```

- 位置: 左侧垂直居中
- 自动隐藏: 鼠标离开 2 秒后隐藏，靠近边缘时显示
- 图标: 线性图标，24×24px
- 悬停: 展开文字标签 + 背景高亮

---

## 七、交互规范

### 7.1 画布交互

| 操作 | 触发方式 | 响应 |
|------|----------|------|
| 创建节点 | 双击空白区域 | 在点击位置创建文本节点 |
| 选中节点 | 单击节点 | 节点高亮边框，显示调整手柄 |
| 多选 | Shift+单击 或 框选 | 所有选中节点高亮 |
| 移动节点 | 拖拽节点标题栏 | 节点跟随鼠标，连接线实时更新 |
| 缩放 | 滚轮 / 触摸板捏合 | 以鼠标位置为中心缩放 |
| 平移 | 拖拽空白区域 / 触摸板双指拖动 | 画布跟随移动 |
| 删除 | Delete / Backspace | 删除选中节点 |

### 7.2 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + N` | 新建画布 |
| `Cmd/Ctrl + K` | 全局搜索 |
| `Cmd/Ctrl + S` | 手动保存 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + Shift + Z` | 重做 |
| `Cmd/Ctrl + A` | 全选 |
| `Cmd/Ctrl + D` | 复制选中节点 |
| `Cmd/Ctrl + G` | 创建群组 |
| `Space + 拖拽` | 平移画布 |
| `@` | 唤起 AI 对话 |
| `Tab` | 切换到下一个节点 |

---

## 八、响应式策略

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| Desktop | >= 1024px | 完整布局，侧边栏可展开 |
| Tablet | 768-1023px | 侧边栏折叠为图标 |
| Mobile | < 768px | MVP 不支持移动端 |
