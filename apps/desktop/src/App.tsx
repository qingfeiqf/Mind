import { useEffect } from "react";
import { Canvas } from "./components/canvas/Canvas";
import { Sidebar } from "./components/sidebar/Sidebar";
import { AIPanel } from "./components/ai/AIPanel";
import { Toolbar } from "./components/ui/Toolbar";
import { useSettingsStore } from "./stores/settingsStore";
import { useCanvasStore } from "./stores/canvasStore";
import { v4 as uuid } from "uuid";
import { NODE_DEFAULT_WIDTH, NODE_DEFAULT_HEIGHT } from "@mind/shared";
import type { MindNode } from "@mind/shared";

export function App() {
  const theme = useSettingsStore((s) => s.theme);
  const canvasId = useCanvasStore((s) => s.canvasId);
  const setCanvas = useCanvasStore((s) => s.setCanvas);
  const addNode = useCanvasStore((s) => s.addNode);
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!canvasId) {
      const id = uuid();
      setCanvas(id, "My MindSpace");
    }
  }, [canvasId, setCanvas]);

  const handleCanvasDoubleClick = (x: number, y: number) => {
    if (!canvasId) return;
    const node: MindNode = {
      id: uuid(),
      canvasId,
      type: "text",
      x: x - NODE_DEFAULT_WIDTH / 2,
      y: y - NODE_DEFAULT_HEIGHT / 2,
      width: NODE_DEFAULT_WIDTH,
      height: NODE_DEFAULT_HEIGHT,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
    };
    addNode(node);
    setActiveNode(node.id);
  };

  return (
    <div className="app-root">
      <Sidebar />
      <main className="canvas-area">
        <Canvas onDoubleClick={handleCanvasDoubleClick} />
        <Toolbar />
      </main>
      <AIPanel />
    </div>
  );
}
