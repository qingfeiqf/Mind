import { useEffect } from "react";
import { Canvas } from "./components/canvas/Canvas";
import { Sidebar } from "./components/sidebar/Sidebar";
import { AIPanel } from "./components/ai/AIPanel";
import { Toolbar } from "./components/ui/Toolbar";
import { useSettingsStore } from "./stores/settingsStore";
import { useCanvasStore } from "./stores/canvasStore";
import { v4 as uuid } from "uuid";

export function App() {
  const theme = useSettingsStore((s) => s.theme);
  const canvasId = useCanvasStore((s) => s.canvasId);
  const setCanvas = useCanvasStore((s) => s.setCanvas);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!canvasId) {
      const id = uuid();
      setCanvas(id, "My MindSpace");
    }
  }, [canvasId, setCanvas]);

  return (
    <div className="app-root">
      <Sidebar />
      <main className="canvas-area">
        <Canvas />
        <Toolbar />
      </main>
      <AIPanel />
    </div>
  );
}
