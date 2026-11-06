import React, { useState, useEffect } from "react";

export default function FacultyWhatsAppModal({
  isOpen,
  onClose,
  contacts,
  onSaveContacts,
  selectedId,
  onSelectFaculty
}) {
  const [facultyList, setFacultyList] = useState(contacts || []);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    setFacultyList(contacts || []);
  }, [contacts]);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact = {
      id: `faculty_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim()
    };

    const updated = [...facultyList, newContact];
    setFacultyList(updated);
    onSaveContacts(updated);
    onSelectFaculty(newContact.id);
    setNewName("");
    setNewPhone("");
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim() || !editPhone.trim()) return;
    const updated = facultyList.map((c) =>
      c.id === id ? { ...c, name: editName.trim(), phone: editPhone.trim() } : c
    );
    setFacultyList(updated);
    onSaveContacts(updated);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const updated = facultyList.filter((c) => c.id !== id);
    setFacultyList(updated);
    onSaveContacts(updated);
    if (selectedId === id) {
      if (updated.length > 0) {
        onSelectFaculty(updated[0].id);
      } else {
        onSelectFaculty("custom");
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all saved faculty contacts?")) {
      setFacultyList([]);
      onSaveContacts([]);
      onSelectFaculty("custom");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="facultyModalTitle"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📱</span>
            <div>
              <h3 className="modal-title" id="facultyModalTitle" style={{ margin: 0 }}>
                Faculty WhatsApp Numbers
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Add your faculty contacts here to receive attendance reports via WhatsApp.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Add New Contact Form */}
          <form onSubmit={handleAdd} className="add-faculty-form">
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              ➕ Add New Faculty Contact
            </label>
            <div className="add-faculty-inputs">
              <input
                type="text"
                className="input-control"
                placeholder="Faculty Name / Role (e.g. Dr. Ramesh)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                type="tel"
                className="input-control"
                placeholder="WhatsApp Number (e.g. 9876543210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap" }}>
                Add Contact
              </button>
            </div>
          </form>

          {/* List of Contacts */}
          <div className="faculty-contacts-list" style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Saved Faculty Contacts ({facultyList.length})
              </span>
              {facultyList.length > 0 && (
                <button
                  type="button"
                  className="btn-link text-sm"
                  onClick={handleClearAll}
                  title="Clear all saved contacts"
                  style={{ background: "none", border: "none", color: "var(--absent-color)", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  🗑️ Clear All
                </button>
              )}
            </div>

            {facultyList.length === 0 ? (
              <div style={{ padding: "1.5rem 1rem", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", margin: "8px 0" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  No faculty contacts saved yet.
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Add faculty members above. Any contacts you add will be saved permanently.
                </p>
              </div>
            ) : (

              <div className="faculty-cards-grid">
                {facultyList.map((c) => {
                  const isSelected = selectedId === c.id;
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`faculty-item-card ${isSelected ? "faculty-item-selected" : ""}`}
                    >
                      {isEditing ? (
                        <div className="faculty-edit-mode">
                          <input
                            type="text"
                            className="input-control input-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            type="tel"
                            className="input-control input-sm"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-success btn-xs"
                              onClick={() => handleSaveEdit(c.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="faculty-card-inner">
                          <div className="faculty-card-info">
                            <span className="faculty-card-name">
                              {c.name}
                              {isSelected && <span className="faculty-active-badge">Selected</span>}
                            </span>
                            <span className="faculty-card-phone">
                              <span style={{ color: "#25D366", marginRight: "5px" }}>●</span>
                              {c.phone}
                            </span>
                          </div>

                          <div className="faculty-card-actions">
                            {!isSelected && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  onSelectFaculty(c.id);
                                  onClose();
                                }}
                                title="Select this faculty"
                                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              >
                                Select
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => startEdit(c)}
                              title="Edit faculty"
                              style={{ padding: "4px 6px", fontSize: "0.75rem" }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary text-danger"
                              onClick={() => handleDelete(c.id)}
                              title="Delete faculty"
                              style={{ padding: "4px 6px", fontSize: "0.75rem" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
