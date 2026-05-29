import { useEffect, useRef, useState, useCallback } from "react";
import { createEmptyDoc, EdgelessEditor, PageEditor } from "@blocksuite/presets";

export type EditorMode = "edgeless" | "page";

interface UseBlockSuiteReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useBlockSuite(): UseBlockSuiteReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EdgelessEditor | PageEditor | null>(null);
  const docRef = useRef<ReturnType<ReturnType<typeof createEmptyDoc>["init"]> | null>(null);

  const [mode, setModeState] = useState<EditorMode>("edgeless");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize doc once
  useEffect(() => {
    const { doc, init } = createEmptyDoc();
    init();
    docRef.current = doc;

    return () => {
      docRef.current = null;
    };
  }, []);

  // Mount/swap editor when mode changes or container becomes available
  useEffect(() => {
    const container = containerRef.current;
    const doc = docRef.current;
    if (!container || !doc) return;

    // Remove previous editor
    if (editorRef.current) {
      editorRef.current.remove();
      editorRef.current = null;
    }

    // Create new editor based on mode
    const editor =
      mode === "edgeless" ? new EdgelessEditor() : new PageEditor();
    editor.doc = doc;
    container.appendChild(editor);
    editorRef.current = editor;

    return () => {
      editor.remove();
      editorRef.current = null;
    };
  }, [mode, docRef.current]);

  // Poll undo/redo state
  useEffect(() => {
    const interval = setInterval(() => {
      const doc = docRef.current;
      if (doc) {
        try {
          setCanUndo(doc.canUndo());
          setCanRedo(doc.canRedo());
        } catch {
          // ignore
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const undo = useCallback(() => {
    docRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    docRef.current?.redo();
  }, []);

  const setMode = useCallback((newMode: EditorMode) => {
    setModeState(newMode);
  }, []);

  return { containerRef, mode, setMode, undo, redo, canUndo, canRedo };
}
