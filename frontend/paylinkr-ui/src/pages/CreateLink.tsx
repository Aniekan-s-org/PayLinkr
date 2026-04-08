import { useState } from "react";
import { useNavigate } from "react-router-dom";

/** Generates a random 8-char alphanumeric ID for the payment link */
function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function CreateLink() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      const id = generateId();

      // TODO: call contract create_request() here via soroban.ts
      // For now we store in localStorage so the demo works without a deployed contract
      const expiryTs = expiry ? Math.floor(new Date(expiry).getTime() / 1000) : 0;
      localStorage.setItem(
        `paylinkr_${id}`,
        JSON.stringify({ amount, description, expiry: expiryTs, paid: false })
      );

      const link = `${window.location.origin}/pay/${id}`;
      setGeneratedLink(link);
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
  }

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>💸 PayLinkr</h1>
      <p style={styles.subtitle}>Create a payment link in seconds</p>

      <form onSubmit={handleGenerate} style={styles.form}>
        <label style={styles.label}>
          Amount (USD)
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="10.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Description (optional)
          <input
            type="text"
            placeholder="e.g. Logo design"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Expiry date (optional)
          <input
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            style={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Generating…" : "Generate Link →"}
        </button>
      </form>

      {generatedLink && (
        <div style={styles.result}>
          <p style={styles.linkLabel}>Your payment link:</p>
          <code style={styles.linkBox}>{generatedLink}</code>
          <div style={styles.actions}>
            <button onClick={copyLink} style={styles.secondaryBtn}>
              Copy
            </button>
            <button
              onClick={() => navigate(`/status/${generatedLink.split("/").pop()}`)}
              style={styles.secondaryBtn}
            >
              Check Status
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 480, margin: "60px auto", padding: "0 20px", fontFamily: "sans-serif" },
  title: { fontSize: 32, margin: 0 },
  subtitle: { color: "#666", marginBottom: 32 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14, fontWeight: 600 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16 },
  button: {
    padding: "12px 0", background: "#6c47ff", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", marginTop: 8,
  },
  result: { marginTop: 32, padding: 20, background: "#f5f3ff", borderRadius: 12 },
  linkLabel: { margin: "0 0 8px", fontWeight: 600 },
  linkBox: { display: "block", wordBreak: "break-all", fontSize: 13, color: "#333" },
  actions: { display: "flex", gap: 12, marginTop: 16 },
  secondaryBtn: {
    padding: "8px 16px", background: "#fff", border: "1px solid #6c47ff",
    color: "#6c47ff", borderRadius: 8, cursor: "pointer", fontSize: 14,
  },
};
