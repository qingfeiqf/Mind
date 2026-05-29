import { create } from "zustand";
import type { UUID, MindNode, Edge, Group, Viewport } from "@mind/shared";
import {
  CANVAS_DEFAULT_ZOOM,
  CANVAS_MIN_ZOOM,
  CANVAS_MAX_ZOOM,
} from "@mind/shared";

interface CanvasStore {
  // 画布状态
  canvasId: UUID | null;
  canvasName: string;
  viewport: Viewport;

  // 数据
  nodes: Map<UUID, MindNode>;
  edges: Map<UUID, Edge>;
  groups: Map<UUID, Group>;
  nodeContents: Map<UUID, string>;

  // 选择
  selectedNodeIds: Set<UUID>;
  activeNodeId: UUID | null;

  // Actions
  setCanvas: (id: UUID, name: string) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;

  addNode: (node: MindNode) => void;
  updateNode: (id: UUID, updates: Partial<MindNode>) => void;
  removeNode: (id: UUID) => void;
  setNodeContent: (id: UUID, content: string) => void;

  addEdge: (edge: Edge) => void;
  removeEdge: (id: UUID) => void;

  selectNode: (id: UUID, multi?: boolean) => void;
  deselectAll: () => void;
  setActiveNode: (id: UUID | null) => void;

  loadCanvas: (data: {
    nodes: MindNode[];
    edges: Edge[];
    groups: Group[];
    contents: Map<UUID, string>;
  }) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvasId: null,
  canvasName: "Untitled",
  viewport: {
    x: 0,
    y: 0,
    zoom: CANVAS_DEFAULT_ZOOM,
    width: window.innerWidth,
    height: window.innerHeight,
  },

  nodes: new Map(),
  edges: new Map(),
  groups: new Map(),
  nodeContents: new Map(),

  selectedNodeIds: new Set(),
  activeNodeId: null,

  setCanvas: (id, name) => set({ canvasId: id, canvasName: name }),

  setViewport: (updates) =>
    set((state) => ({
      viewport: { ...state.viewport, ...updates },
    })),

  zoomIn: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(state.viewport.zoom * 1.2, CANVAS_MAX_ZOOM),
      },
    })),

  zoomOut: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(state.viewport.zoom / 1.2, CANVAS_MIN_ZOOM),
      },
    })),

  resetView: () =>
    set((state) => ({
      viewport: { ...state.viewport, x: 0, y: 0, zoom: CANVAS_DEFAULT_ZOOM },
    })),

  addNode: (node) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.id, node);
      return { nodes };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      const existing = state.nodes.get(id);
      if (!existing) return state;
      const nodes = new Map(state.nodes);
      nodes.set(id, { ...existing, ...updates, updatedAt: Date.now() });
      return { nodes };
    }),

  removeNode: (id) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.delete(id);
      const contents = new Map(state.nodeContents);
      contents.delete(id);
      const selected = new Set(state.selectedNodeIds);
      selected.delete(id);
      return {
        nodes,
        nodeContents: contents,
        selectedNodeIds: selected,
        activeNodeId: state.activeNodeId === id ? null : state.activeNodeId,
      };
    }),

  setNodeContent: (id, content) =>
    set((state) => {
      const contents = new Map(state.nodeContents);
      contents.set(id, content);
      return { nodeContents: contents };
    }),

  addEdge: (edge) =>
    set((state) => {
      const edges = new Map(state.edges);
      edges.set(edge.id, edge);
      return { edges };
    }),

  removeEdge: (id) =>
    set((state) => {
      const edges = new Map(state.edges);
      edges.delete(id);
      return { edges };
    }),

  selectNode: (id, multi = false) =>
    set((state) => {
      if (multi) {
        const selected = new Set(state.selectedNodeIds);
        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
        return { selectedNodeIds: selected };
      }
      return { selectedNodeIds: new Set([id]) };
    }),

  deselectAll: () => set({ selectedNodeIds: new Set(), activeNodeId: null }),

  setActiveNode: (id) => set({ activeNodeId: id }),

  loadCanvas: (data) =>
    set({
      nodes: new Map(data.nodes.map((n) => [n.id, n])),
      edges: new Map(data.edges.map((e) => [e.id, e])),
      groups: new Map(data.groups.map((g) => [g.id, g])),
      nodeContents: data.contents,
    }),
}));
