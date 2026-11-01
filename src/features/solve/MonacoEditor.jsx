import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useCalibr8 } from "../../context/Calibr8Context";

// --- Constants ---
// true for copy or paste, false for neither
const CLIPBOARD_RULES = {
  standard: { copy: true, paste: true },
  strict: { copy: true, paste: true },
};

const LANGUAGE_MAP = {
  python3: "python",
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  "c++": "cpp",
  cpp: "cpp",
  c: "c",
  java: "java",
  "c#": "csharp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  kotlin: "kotlin",
  swift: "swift",
  sql: "sql",
};

const getMonacoLanguage = (lang) => {
  if (!lang) return "python";
  return LANGUAGE_MAP[lang.toLowerCase()] || LANGUAGE_MAP[lang] || "python";
};

const STYLES = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid var(--ln)",
    background: "var(--code)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
  editorWrapper: { height: "420px", width: "100%", position: "relative" },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 14px",
    background: "rgba(3, 7, 18, 0.9)",
    borderTop: "1px solid var(--ln)",
    fontSize: "11px",
    color: "var(--mu)",
    userSelect: "none",
  },
  kbd: {
    background: "var(--cf)",
    padding: "2px 5px",
    borderRadius: "4px",
    border: "1px solid var(--ln)",
  },
};

// --- Small Components ---

const Kbd = ({ children }) => <kbd style={STYLES.kbd}>{children}</kbd>;

function EditorStatusBar({ cursorPos, language, isStrictMode, clipboard, showMinimap, onToggleMinimap }) {
  return (
    <div style={STYLES.statusBar}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>•</span>
        <span style={{ textTransform: "uppercase", fontWeight: 600, color: "var(--fg)" }}>
          {language}
        </span>
        <span>•</span>
        <span style={{ color: isStrictMode ? "var(--bad)" : "#2ED47A" }}>
          {isStrictMode ? "Strict Mode" : "Standard Practice"} · Copy {clipboard.copy ? "On" : "Off"} · Paste{" "}
          {clipboard.paste ? "On" : "Off"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <span>
          <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> Run
        </span>
        <button
          type="button"
          onClick={onToggleMinimap}
          style={{
            background: "none",
            border: "none",
            color: showMinimap ? "var(--ac)" : "var(--mu)",
            cursor: "pointer",
            fontSize: "11px",
            padding: "2px 4px",
          }}
          title="Toggle code minimap"
        >
          {showMinimap ? "Hide Map" : "Minimap"}
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

export function MonacoEditor({
  value,
  onChange,
  language = "Python3",
  readOnly = false,
  isStrictMode = false,
  onPasteBlocked,
  onRun,
  onSubmit,
}) {
  const { state } = useCalibr8();
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showMinimap, setShowMinimap] = useState(false);

  const editorRef = useRef(null);
  
  // Refs to avoid stale closures inside monaco listeners
  const callbacksRef = useRef({ onPasteBlocked, onRun, onSubmit });
  const clipboardRef = useRef(CLIPBOARD_RULES.standard);

  useEffect(() => {
    callbacksRef.current = { onPasteBlocked, onRun, onSubmit };
  }, [onPasteBlocked, onRun, onSubmit]);

  const monacoLang = useMemo(() => getMonacoLanguage(language), [language]);
  
  const clipboard = useMemo(() => {
    return isStrictMode ? CLIPBOARD_RULES.strict : CLIPBOARD_RULES.standard;
  }, [isStrictMode]);

  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  const monacoTheme = state.mode === "light" ? "vs" : "vs-dark";

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // 1. Cursor tracking
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    // 2. Keyboard shortcuts (block copy/paste + run/submit)
    const keyDownDisposable = editor.onKeyDown((e) => {
      const isMod = e.ctrlKey || e.metaKey;
      const { paste, copy } = clipboardRef.current;

      const isPaste = isMod && e.code === "KeyV";
      const isCopyOrCut = isMod && (e.code === "KeyC" || e.code === "KeyX");

      if ((isPaste && !paste) || (isCopyOrCut && !copy)) {
        e.preventDefault();
        e.stopPropagation();
        if (isPaste) callbacksRef.current.onPasteBlocked?.();
        return;
      }

      if (isMod && e.code === "Enter") {
        e.preventDefault();
        if (e.shiftKey) callbacksRef.current.onSubmit?.();
        else callbacksRef.current.onRun?.();
      }
    });

    // 3. Native DOM clipboard events (for context menu / drag)
    const editorNode = editor.getDomNode();
    const blockNativeEvent = (event) => {
      const allowed = event.type === "paste" ? clipboardRef.current.paste : clipboardRef.current.copy;
      if (!allowed) {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === "paste") callbacksRef.current.onPasteBlocked?.();
      }
    };

    editorNode?.addEventListener("paste", blockNativeEvent, true);
    editorNode?.addEventListener("copy", blockNativeEvent, true);
    editorNode?.addEventListener("cut", blockNativeEvent, true);

    // 4. Actions for command palette
    editor.addAction({
      id: "run-code-action",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => callbacksRef.current.onRun?.(),
    });
    editor.addAction({
      id: "submit-code-action",
      label: "Submit Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => callbacksRef.current.onSubmit?.(),
    });

    // 5. Cleanup
    editor.onDidDispose(() => {
      cursorDisposable.dispose();
      keyDownDisposable.dispose();
      editorNode?.removeEventListener("paste", blockNativeEvent, true);
      editorNode?.removeEventListener("copy", blockNativeEvent, true);
      editorNode?.removeEventListener("cut", blockNativeEvent, true);
    });
  }, []);

  return (
    <div style={STYLES.container}>
      <div style={STYLES.editorWrapper}>
        <Editor
          height="100%"
          language={monacoLang}
          theme={monacoTheme}
          value={value}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            fontSize: 13,
            lineNumbers: "on",
            lineDecorationsWidth: 12,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: "'Space Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "all",
            tabSize: 4,
            wordWrap: "on",
            quickSuggestions: true,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            contextmenu: clipboard.copy || clipboard.paste,
          }}
        />
      </div>

      <EditorStatusBar
        cursorPos={cursorPos}
        language={language}
        isStrictMode={isStrictMode}
        clipboard={clipboard}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((p) => !p)}
      />
    </div>
  );
}

export default MonacoEditor;