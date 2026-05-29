import { useBlockSuite } from "@/hooks/useBlockSuite";

export function Canvas() {
  const { containerRef, mode, setMode, undo, redo, canUndo, canRedo } =
    useBlockSuite();

  return (
    <div className="blocksuite-container" ref={containerRef}>
      <div className="blocksuite-toolbar-overlay">
        <button
          className="mode-toggle-btn"
          onClick={() => setMode(mode === "edgeless" ? "page" : "edgeless")}
          title={mode === "edgeless" ? "Switch to Document" : "Switch to Canvas"}
        >
          {mode === "edgeless" ? "DOC" : "CANVAS"}
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
