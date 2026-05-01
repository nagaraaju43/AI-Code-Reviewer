// import { useState, useEffect, useRef } from "react";
// import Editor from "react-simple-code-editor";
// import prism from "prismjs";
// import ReactMarkdown from "react-markdown";
// import { Copy, Sparkles, Terminal, CheckCircle2 } from "lucide-react";
// import "prismjs/themes/prism-tomorrow.css";
// import "prismjs/components/prism-javascript";
// import "./App.css";

// function App() {
//   const [code, setCode] = useState(`function sum() {\n  return 1 + 1\n}`);
//   const [review, setReview] = useState("");
//   const [loading, setLoading] = useState(false);
//   const rightRef = useRef(null);

//   // Auto-scroll logic for the review panel
//   useEffect(() => {
//     if (rightRef.current) {
//       rightRef.current.scrollTo({
//         top: rightRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [review]);

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(code);
//   };

//   async function reviewCode() {
//     if (!code.trim() || loading) return;

//     setReview("");
//     setLoading(true);

//     try {
//       const response = await fetch("http://localhost:3000/ai/stream-review", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ code }),
//       });

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value, { stream: true });
//         const lines = chunk.split("\n");

//         lines.forEach((line) => {
//           if (line.startsWith("data: ")) {
//             // CRITICAL: We remove .trim() to preserve word spacing
//             const rawData = line.replace("data: ", ""); 

//             if (rawData === "[DONE]") {
//               setLoading(false);
//             } else {
//               setReview((prev) => prev + rawData);
//             }
//           }
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       setReview("### ⚠️ Connection Error\nCould not connect to the review server.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <div className="logo">
//           <Sparkles size={20} className="icon-purple" />
//           <h1>AI Code Reviewer</h1>
//         </div>
//         <button 
//           onClick={reviewCode} 
//           disabled={loading}
//           className={`run-button ${loading ? "loading" : ""}`}
//         >
//           {loading ? "Analyzing..." : "Review Code"}
//         </button>
//       </header>

//       <main>
//         {/* LEFT PANEL: CODE EDITOR */}
//         <section className="panel">
//           <div className="panel-header">
//             <span><Terminal size={14} /> input.js</span>
//             <button className="icon-btn" onClick={copyToClipboard} title="Copy Code">
//               <Copy size={14} />
//             </button>
//           </div>
//           <div className="editor-wrapper">
//             <Editor
//               value={code}
//               onValueChange={setCode}
//               highlight={(code) => prism.highlight(code, prism.languages.javascript, "javascript")}
//               padding={20}
//               style={{
//                 fontFamily: '"Fira Code", monospace',
//                 fontSize: 16,
//                 minHeight: "100%",
//               }}
//             />
//           </div>
//         </section>

//         {/* RIGHT PANEL: AI ANALYSIS */}
//         <section className="panel" ref={rightRef}>
//           <div className="panel-header">
//             <span><CheckCircle2 size={14} /> AI Analysis</span>
//           </div>
//           <div className="review-content">
//             {review ? (
//               <ReactMarkdown className="markdown-body">
//                 {review}
//               </ReactMarkdown>
//             ) : (
//               <div className="empty-state">
//                 <p>Paste your code and click "Review Code" to see AI feedback.</p>
//               </div>
//             )}
//             {loading && <div className="typing-indicator">AI is thinking...</div>}
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

// export default App;

import { useState, useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "prismjs/themes/prism-tomorrow.css";
import "./App.css";

const PLACEHOLDER_CODE = `async function loginUser(req, res) {
  const { email, password } = req.body

  const user = await db.query(
    \`SELECT * FROM users WHERE email = '\${email}'\`
  )

  if (user.password == password) {
    res.json({ success: true, user })
  } else {
    res.json({ success: false })
  }
}

module.exports = { loginUser }`;

function ReviewPlaceholder() {
  return (
    <div className="review-placeholder">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#1a1c24"/>
        <path d="M20 11V24M14 18l6 6 6-6" stroke="#2e3140" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="12" y="28" width="16" height="1.5" rx="0.75" fill="#2e3140"/>
      </svg>
      <span className="placeholder-text">Submit your code to receive AI feedback</span>
      <span className="placeholder-sub">Click "Review Code" to start analysis</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="loading-state">
      <div className="streaming-indicator">
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <span className="streaming-label">Analyzing code structure...</span>
      </div>
      <div className="skeleton" style={{ width: "90%" }} />
      <div className="skeleton" style={{ width: "75%" }} />
      <div className="skeleton" style={{ width: "95%" }} />
      <div className="skeleton" style={{ width: "60%", marginBottom: 24 }} />
      <div className="skeleton" style={{ width: "85%" }} />
      <div className="skeleton" style={{ width: "70%" }} />
      <div className="skeleton" style={{ width: "90%" }} />
    </div>
  );
}

// Shows raw streaming text with a blinking cursor, then
// switches to rendered markdown once streaming is done.
function StreamingText({ text }) {
  return (
    <div className="streaming-raw">
      <pre className="streaming-pre">{text}<span className="cursor" /></pre>
    </div>
  );
}

export default function App() {
  const [code, setCode]       = useState(PLACEHOLDER_CODE);
  const [review, setReview]   = useState("");
  const [loading, setLoading] = useState(false);
  const reviewRef             = useRef(null);

  // Auto-scroll as content streams in
  useEffect(() => {
    if (reviewRef.current) {
      reviewRef.current.scrollTop = reviewRef.current.scrollHeight;
    }
  }, [review]);

  async function reviewCode() {
    if (!code.trim() || loading) return;
    setReview("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/ai/stream-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let done      = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done    = doneReading;
        buffer += decoder.decode(value, { stream: true });

        // Split on newlines but keep the last partial line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop(); // last element may be incomplete

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6); // strip "data: "
          if (data === "[DONE]") { setLoading(false); continue; }
          if (data) setReview((prev) => prev + data);
        }
      }

      // Flush any remaining buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6);
        if (data && data !== "[DONE]") setReview((prev) => prev + data);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setReview("**Error:** Streaming failed. Please check your backend connection.");
      setLoading(false);
    }
  }

  const lineCount = code.split("\n").length;
  const wordCount = code.trim().split(/\s+/).length;

  return (
    <div className="app-shell">

      {/* TITLEBAR */}
      <header className="titlebar">
        <div className="titlebar-dots">
          <span className="dot dot-r" />
          <span className="dot dot-y" />
          <span className="dot dot-g" />
        </div>
        <span className="titlebar-name">ai-review / workspace</span>
        <span className="titlebar-badge">AI Review</span>
      </header>

      <div className="app-body">

        {/* LEFT — EDITOR */}
        <div className="panel left-panel">
          <div className="panel-header">
            <span className="panel-label">Editor</span>
            <span className="lang-chip">JavaScript</span>
          </div>

          <div className="editor-wrap">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(c) => prism.highlight(c, prism.languages.javascript, "javascript")}
              padding={20}
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: 13,
                lineHeight: 1.8,
                minHeight: "100%",
                background: "transparent",
                color: "#e2e4e9",
              }}
            />
          </div>

          <footer className="panel-footer">
            <div className="footer-stats">
              <span className="stat"><span className="stat-dot ok" />{lineCount} lines</span>
              <span className="stat"><span className="stat-dot muted" />{wordCount} tokens</span>
            </div>
            <button className="review-btn" onClick={reviewCode} disabled={loading}>
              {loading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="#4cae7a" strokeWidth="1.5" strokeDasharray="3 2">
                      <animateTransform attributeName="transform" type="rotate"
                        from="0 6.5 6.5" to="360 6.5 6.5" dur="0.9s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1.5v8M3 6.5l3.5 3.5 3.5-3.5" stroke="#4cae7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="1.5" y="11" width="10" height="1" rx="0.5" fill="#4cae7a"/>
                  </svg>
                  Review Code
                </>
              )}
            </button>
          </footer>
        </div>

        {/* RIGHT — REVIEW OUTPUT */}
        <div className="panel right-panel">
          <div className="panel-header">
            <span className="panel-label">Review Output</span>
            {review && !loading && (
              <span className="score-badge">✓ Complete</span>
            )}
            {loading && (
              <div className="header-stream-indicator">
                <div className="pulse-dot" />
                <div className="pulse-dot" />
                <div className="pulse-dot" />
              </div>
            )}
          </div>

          <div className="review-scroll" ref={reviewRef}>

            {/* Empty state */}
            {!review && !loading && <ReviewPlaceholder />}

            {/* Initial skeleton before first token arrives */}
            {loading && !review && <LoadingSkeleton />}

            {/* While streaming: show raw preformatted text with cursor */}
            {review && loading && <StreamingText text={review} />}

            {/* Once done: render full beautiful markdown */}
            {review && !loading && (
              <div className="review-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}