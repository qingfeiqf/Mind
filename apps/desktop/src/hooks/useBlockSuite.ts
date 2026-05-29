import { useEffect, useRef, useState, useCallback } from "react";
import {
  AffineEditorContainer,
  createEmptyDoc,
} from "@blocksuite/presets";
import { effects } from "@blocksuite/presets/effects";

export type EditorMode = "edgeless" | "page";

let effectsCalled = false;

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
  const editorRef = useRef<AffineEditorContainer | null>(null);
  const docRef = useRef<ReturnType<ReturnType<typeof createEmptyDoc>["init"]> | null>(null);

  const [mode, setModeState] = useState<EditorMode>("edgeless");
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Register BlockSuite custom elements once
  useEffect(() => {
    if (!effectsCalled) {
      effects();
      effectsCalled = true;
    }
  }, []);

  // Initialize doc once
  useEffect(() => {
    const { doc, init } = createEmptyDoc();
    init();
    docRef.current = doc;
    setReady(true);

    return () => {
      docRef.current = null;
    };
  }, []);

  // Mount AffineEditorContainer when ready
  useEffect(() => {
    const container = containerRef.current;
    const doc = docRef.current;
    if (!container || !doc || !ready) return;

    // Remove previous editor
    if (editorRef.current) {
      editorRef.current.remove();
      editorRef.current = null;
    }

    // Use AffineEditorContainer for proper mode switching
    const editor = new AffineEditorContainer();
    editor.doc = doc;
    editor.mode = mode;
    container.appendChild(editor);
    editorRef.current = editor;

    return () => {
      editor.remove();
      editorRef.current = null;
    };
  }, [ready]);

  // Handle mode switching
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.switchEditor(mode);
    }
  }, [mode]);

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
