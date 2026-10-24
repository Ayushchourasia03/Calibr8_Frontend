import Editor from "@monaco-editor/react";
import { useCalibr8 } from "../../context/Calibr8Context";

const LANGUAGE_MAP = {
  Python3: "python",
  Python: "python",
  JavaScript: "javascript",
  TypeScript: "typescript",
  "C++": "cpp",
  C: "c",
  Java: "java",
  "C#": "csharp",
  Go: "go",
  Rust: "rust",
  Ruby: "ruby",
  PHP: "php",
  Kotlin: "kotlin",
  Swift: "swift",
  Dart: "dart",
  Scala: "scala",
  Elixir: "elixir",
  Erlang: "erlang",
  Racket: "scheme",
};

export function MonacoEditor({
  value,
  onChange,
  language = "Python3",
  readOnly = false,
  isStrictMode = false,
  onPasteBlocked,
}) {
  const { state } = useCalibr8();
  const isLight = state.mode === "light";
  const monacoLang = LANGUAGE_MAP[language] || "python";

  const handleEditorDidMount = (editor) => {
    if (isStrictMode) {
      editor.onKeyDown((e) => {
        // Detect paste shortcuts (Ctrl+V / Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") {
          e.preventDefault();
          e.stopPropagation();
          onPasteBlocked?.();
        }
      });
    }
  };

  return (
    <div
      style={{
        height: "360px",
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--ln)",
        background: "var(--code)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      <Editor
        height="100%"
        language={monacoLang}
        theme={isLight ? "vs" : "vs-dark"}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          lineDecorationsWidth: 10,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          padding: { top: 10, bottom: 10 },
          renderLineHighlight: "all",
          tabSize: 4,
          wordWrap: "on",
          quickSuggestions: true,
        }}
      />
    </div>
  );
}
