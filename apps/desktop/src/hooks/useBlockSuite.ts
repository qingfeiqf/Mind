import { useEffect, useRef, useState, useCallback } from "react";
import { createEmptyDoc, EdgelessEditor, PageEditor } from "@blocksuite/presets";
import { IndexeddbPersistence } from "y-indexeddb";
import type { Doc } from "@blocksuite/store";

export type EditorMode = "edgeless" | "page";

interface UseBlockSuiteOptions {
  docId?: string;
}

interface UseBlockSuiteReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useBlockSuite(
  options: UseBlockSuiteOptions = {},
): UseBlockSuiteReturn {
  const { docId = "mindspace-default" } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EdgelessEditor | PageEditor | null>(null);
  const docRef = useRef<Doc | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);

  const [mode, setModeState] = useState<EditorMode>("edgeless");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize doc and persistence once
  useEffect(() => {
    const doc = createEmptyDoc().init();

    const persistence = new IndexeddbPersistence(docId, doc.spaceDoc);
    persistenceRef.current = persistence;

    doc.load(() => {
      if (doc.root === undefined) {
        const rootBlockId = doc.addBlock("affine:page", {});
        doc.addBlock("affine:surface", {}, rootBlockId);
        const noteId = doc.addBlock("affine:note", {}, rootBlockId);
        doc.addBlock("affine:paragraph", {}, noteId);
      }
    });

    docRef.current = doc;

    return () => {
      persistence.destroy();
      persistenceRef.current = null;
      docRef.current = null;
    };
  }, [docId]);

  // Mount/swap editor when mode changes or container becomes available
  useEffect(() => {
    const container = containerRef.current;
    const doc = docRef.current;
    if (!container || !doc) return;

    if (editorRef.current) {
      editorRef.current.remove();
      editorRef.current = null;
    }

    const editor =
      mode === "edgeless" ? new EdgelessEditor() : new PageEditor();
    editor.doc = doc;
    container.appendChild(editor);
    editorRef.current = editor;

    return () => {
      editor.remove();
      editorRef.current = null;
    };
  }, [mode]);

  // Poll undo/redo state
  useEffect(() => {
    const interval = setInterval(() => {
      const doc = docRef.current;
      if (doc) {
        setCanUndo(doc.canUndo());
        setCanRedo(doc.canRedo());
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
