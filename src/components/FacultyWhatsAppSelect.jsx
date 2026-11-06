import React from "react";

export default function FacultyWhatsAppSelect({
  contacts,
  selectedId,
  onChangeFacultyId,
  customPhone,
  onChangeCustomPhone,
  onOpenManage,
  autoSendWhatsApp,
  onToggleAutoSend
}) {
  return (
    <div className="whatsapp-selector-container">
      <div className="whatsapp-label-group">
        <svg
          className="whatsapp-icon-svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="#25D366" stroke="#25D366" />
        </svg>
        <span className="whatsapp-label-text">WHATSAPP :</span>
      </div>

      <div className="whatsapp-inputs-wrapper">
        <select
          id="facultyWhatsAppSelect"
          className="input-control faculty-whatsapp-dropdown"
          value={selectedId}
          onChange={(e) => onChangeFacultyId(e.target.value)}
          aria-label="Select Faculty WhatsApp Contact"
        >
          {contacts && contacts.length > 0 ? (
            <>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
              <option value="custom">✏️ Enter Custom Number...</option>
            </>
          ) : (
            <option value="custom">✏️ Enter WhatsApp Number...</option>
          )}
        </select>

        {(selectedId === "custom" || !contacts || contacts.length === 0) && (
          <input
            type="tel"
            className="input-control whatsapp-custom-input"
            placeholder="WhatsApp number (e.g. 9876543210)"
            value={customPhone}
            onChange={(e) => onChangeCustomPhone(e.target.value)}
            title="Enter 10-digit mobile or international number with country code"
            aria-label="Custom Faculty WhatsApp Phone Number"
          />
        )}

        <button
          type="button"
          className="btn btn-sm btn-whatsapp-gear"
          onClick={onOpenManage}
          title="Manage Faculty Numbers (Add / Edit / Delete)"
          id="manageFacultyBtn"
        >
          ⚙️ Contacts
        </button>
      </div>

      <label
        className="whatsapp-autosend-toggle"
        title="Automatically open WhatsApp with absent roll numbers when you click Submit Attendance"
      >
        <input
          type="checkbox"
          checked={autoSendWhatsApp}
          onChange={(e) => onToggleAutoSend(e.target.checked)}
        />
        <span className="autosend-label">Auto-send on Submit</span>
      </label>
    </div>
  );
}
