import React, { useState } from "react";

export default function QuickKeyModal({ isOpen, onClose, students, onApplyAbsentKeys }) {
  const [inputText, setInputText] = useState("");
  const [matchedResults, setMatchedResults] = useState([]);

  if (!isOpen) return null;

  const handleTextChange = (text) => {
    setInputText(text);
    if (!text.trim()) {
      setMatchedResults([]);
      return;
    }

    // Split input by space, comma, newline, tab
    const tokens = text
      .split(/[\s,;\n]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    const matches = [];
    tokens.forEach((tok) => {
      // Find matching student
      const matched = students.find(
        (s) =>
          s.roll.toUpperCase() === tok ||
          s.roll.toUpperCase().endsWith(tok) ||
          s.roll.toUpperCase().includes(tok)
      );
      if (matched && !matches.some((m) => m.roll === matched.roll)) {
        matches.push(matched);
      }
    });

    setMatchedResults(matches);
  };

  const handleApply = () => {
    if (matchedResults.length === 0) return;
    onApplyAbsentKeys(matchedResults.map((m) => m.roll));
    setInputText("");
    setMatchedResults([]);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">⌨️</span>
            <h3 className="modal-title">Rapid Roll Key-In (Mark Absent)</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm" style={{ marginBottom: "12px" }}>
            Enter roll numbers or last 2–4 digits separated by spaces or commas (e.g.{" "}
            <code>35, 54, 62, 04114, 4207</code>):
          </p>

          <textarea
            className="input-control"
            rows="4"
            placeholder="Type or paste roll numbers here..."
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}
            autoFocus
          />

          {matchedResults.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Identified Students ({matchedResults.length}):
              </div>
              <div className="chips-container">
                {matchedResults.map((s) => (
                  <span key={s.roll} className="chip chip-absent">
                    <span className="chip-roll">{s.roll}</span>
                    <span className="chip-name">{s.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleApply}
            disabled={matchedResults.length === 0}
          >
            Mark {matchedResults.length} Student{matchedResults.length === 1 ? "" : "s"} Absent
          </button>
        </div>
      </div>
    </div>
  );
}
