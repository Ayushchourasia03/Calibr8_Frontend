import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useCalibr8 } from "../../context/Calibr8Context";

const LANGUAGE_MAP = {
  Python3: "python",
  Python: "python",
  JavaScript: "javascript",
  TypeScript: "typescript",
  "C++": "cpp",
  cpp: "cpp",
  C: "c",
  c: "c",
  Java: "java",
  java: "java",
  "C#": "csharp",
  Go: "go",
  go: "go",
  Rust: "rust",
  rust: "rust",
  Ruby: "ruby",
  PHP: "php",
  Kotlin: "kotlin",
  Swift: "swift",
  SQL: "sql",
};

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
  const isLight = state.mode === "light";
  const monacoLang = LANGUAGE_MAP[language] || "python";

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showMinimap, setShowMinimap] = useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });

    // Keyboard handlers
    editor.onKeyDown((e) => {
      // Detect paste shortcuts in strict mode (Ctrl+V / Cmd+V)
      if (isStrictMode && (e.ctrlKey || e.metaKey) && e.code === "KeyV") {
        e.preventDefault();
        e.stopPropagation();
        onPasteBlocked?.();
        return;
      }

      // Hotkey: Ctrl+Enter or Cmd+Enter -> Run visible samples
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === "Enter") {
        e.preventDefault();
        onRun?.();
        return;
      }

      // Hotkey: Ctrl+Shift+Enter or Cmd+Shift+Enter -> Submit
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "Enter") {
        e.preventDefault();
        onSubmit?.();
        return;
      }
    });

    // Format document action if supported
    editor.addAction({
      id: "run-code-action",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRun?.(),
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--ln)",
        background: "var(--code)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Editor Body */}
      <div style={{ height: "420px", width: "100%", position: "relative" }}>
        <Editor
          height="100%"
          language={monacoLang}
          theme={isLight ? "vs" : "vs-dark"}
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
            contextmenu: !isStrictMode,
          }}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px",
          background: "rgba(3, 7, 18, 0.9)",
          borderTop: "1px solid var(--ln)",
          fontSize: "11px",
          color: "var(--mu)",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>•</span>
          <span style={{ textTransform: "uppercase", fontWeight: 600, color: "var(--fg)" }}>
            {language}
          </span>
          <span>•</span>
          <span style={{ color: isStrictMode ? "var(--bad)" : "#2ED47A" }}>
            {isStrictMode ? "Strict Mode (Paste Disabled)" : "Standard Practice"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span className="mu" style={{ display: "inline-block" }}>
            <kbd style={{ background: "var(--cf)", padding: "2px 5px", borderRadius: "4px", border: "1px solid var(--ln)" }}>Ctrl</kbd>+<kbd style={{ background: "var(--cf)", padding: "2px 5px", borderRadius: "4px", border: "1px solid var(--ln)" }}>Enter</kbd> Run
          </span>
          <button
            type="button"
            onClick={() => setShowMinimap(!showMinimap)}
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
    </div>
  );
}

export default MonacoEditor;
