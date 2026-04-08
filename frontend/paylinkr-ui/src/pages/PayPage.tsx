import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface RequestData {
  amount: string;
  description: string;
  expiry: number;
  paid: boolean;
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    // TODO: replace with contract get_request() call
    const raw = localStorage.getItem(`paylinkr_${id}`);
    if (!raw) {
      setError("Payment link not found.");
      return;
    }
    const data: RequestData = JSON.parse(raw);

    // check expiry
    if (data.expiry > 0 && Date.now() / 1000 > data.expiry) {
      setError("This payment link has expired.");
      return;
    }

    setRequest(data);
  }, [id]);

  async function handlePay() {
    if (!id || !request) return;
    setLoading(true);
    try {
      // TODO: call contract pay() via Freighter wallet + soroban.ts
      // Simulating success for demo
      await new Promise((r) => setTimeout(r, 1200));
      const updated = { ...request, paid: true };
      localStorage.setItem(`paylinkr_${id}`, JSON.stringify(updated));
      navigate(`/status/${id}`);
    } catch (err) {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (error) return <Screen emoji="❌" message={error} />;
  if (!request) return <Screen emoji="⏳" message="Loading payment…" />;
  if (request.paid) return <Screen emoji="✅" message="This invoice is already paid." />;

  const expiryLabel =
    request.expiry > 0
      ? `Expires ${new Date(request.expiry * 1000).toLocaleString()}`
      : "No expiry";

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <p style={styles.meta}>Payment request · {expiryLabel}</p>
        <h2 style={styles.amount}>${request.amount}</h2>
        {request.description && (
          <p style={styles.description}>{request.description}</p>
        )}
        <button onClick={handlePay} disabled={loading} style={styles.payBtn}>
          {loading ? "Processing…" : "Pay Now →"}
        </button>
        <p style={styles.poweredBy}>Powered by PayLinkr on Stellar</p>
      </div>
    </main>
  );
}

function Screen({ emoji, message }: { emoji: string; message: string }) {
  return (
    <main style={styles.container}>
      <div style={{ ...styles.card, textAlign: "center" }}>
        <p style={{ fontSize: 48 }}>{emoji}</p>
        <p>{message}</p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "#f9f9fb" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 380, width: "100%" },
  meta: { color: "#999", fontSize: 13, margin: "0 0 8px" },
  amount: { fontSize: 48, margin: "0 0 8px", color: "#111" },
  description: { color: "#555", marginBottom: 24 },
  payBtn: {
    width: "100%", padding: "14px 0", background: "#6c47ff", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 18, cursor: "pointer",
  },
  poweredBy: { textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 16 },
};
