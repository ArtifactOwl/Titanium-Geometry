import React, { useState } from "react";

const reasons = [
  "Shipping questions",
  "General Questions",
  "Commissions or customized pieces",
  "Titanium questions",
  "Out of stock questions",
];

export default function ContactPage() {
  const [reason, setReason] = useState(reasons[0]);

  return (
    <div style={{ padding: "2rem", maxWidth: 640, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Contact Me</h1>
      <p>If you’ve got a question or a custom idea, I’d love to hear from you.</p>

      <form
        action="https://formsubmit.co/YOUR_EMAIL@example.com"
        method="POST"
        style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}
      >
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="table" />
        <input type="hidden" name="_subject" value={`New contact form submission`} />

        <label>
          Your name
          <input name="name" type="text" required style={input} />
        </label>

        <label>
          Email
          <input name="email" type="email" required style={input} />
        </label>

        <label>
          Reason for contacting
          <select
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={input}
          >
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label>
          Message
          <textarea name="message" rows={6} required style={textarea} />
        </label>

        <label>
          Attachment (optional)
          <input name="attachment" type="file" accept="image/*,application/pdf" style={input} />
        </label>

        <button type="submit" style={button}>Send Message</button>
      </form>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  marginTop: 6,
};

const textarea = { ...input, resize: "vertical" };

const button = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "0.75rem 1.25rem",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};
