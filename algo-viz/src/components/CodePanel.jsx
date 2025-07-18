import React from "react";


function CodePanel({algorithm,codeLines,liveComplexity,css,currentLine}){
    return(
        <div>
                {/* code panel */}
                <div className="code-panel" style={{ background: css.modalBg }}>
                <h3>Code ({algorithm})</h3>
                <pre>
                  {codeLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={idx === currentLine ? "highlight" : ""}
                      style={{
                        borderLeftColor: css.compare,
                        background:
                          idx === currentLine ? css.compare + "22" : "transparent"
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </pre>
                <h4 style={{ marginTop: 12 }}>Live Complexity</h4>
                <pre style={{ fontSize: 14 }}>{liveComplexity || "Ready…"}</pre>
              </div>
            
        </div>
    )

}

export default CodePanel;