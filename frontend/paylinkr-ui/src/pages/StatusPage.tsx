import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface RequestData {
  amount: string;
  description: string;
  expiry: number;
  paid: boolean;
}

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    // TODO: replace with contract is_paid() + get_request() calls
    const raw = localStorage.getItem(`paylinkr_${id}`);
    if (!raw) {
      setError("Payment link not found.");
      return;
    }
    setRequest(JSON.parse(raw));
  }, [id]);

  if (error) {
    return (
      <main style={styles.container}>
        <p>❌ {error}</p>
        <Link to="/">← Create a new link</Link>
      </main>
    );
  }

  if (!request) {
    return <main style={styles.container}><p>⏳ Loading…</p></main>;
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Invoice Status</h2>

        <div style={styles.statusBadge(request.paid)}>
          {request.paid ? "✅ Paid" : "⏳ Unpaid"}
        </div>

        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tdLabel}>Link ID</td>
              <td><code>{id}</code></td>
            </tr>
            <tr>
              <td style={styles.tdLabel}>Amount</td>
              <td>${request.amount}</td>
            </tr>
            {request.description && (
              <tr>
                <td style={styles.tdLabel}>Description</td>
                <td>{request.description}</td>
              </tr>
            )}
            <tr>
              <td style={styles.tdLabel}>Expiry</td>
              <td>
                {request.expiry > 0
                  ? new Date(request.expiry * 1000).toLocaleString()
                  : "None"}
              </td>
            </tr>
          </tbody>
        </table>

        {!request.paid && (
          <Link to={`/pay/${id}`} style={styles.payLink}>
            Share payment link →
          </Link>
        )}

        <Link to="/" style={styles.newLink}>
          + Create another link
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, any> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "#f9f9fb" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 420, width: "100%" },
  heading: { margin: "0 0 20px", fontSize: 22 },
  statusBadge: (paid: boolean): React.CSSProperties => ({
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: 20,
    background: paid ? "#d1fae5" : "#fef3c7",
    color: paid ? "#065f46" : "#92400e",
    fontWeight: 700,
    marginBottom: 24,
  }),
  table: { width: "100%", borderCollapse: "collapse" as const, marginBottom: 24 },
  tdLabel: { color: "#999", paddingRight: 16, paddingBottom: 10, fontSize: 13, verticalAlign: "top" },
  payLink: { display: "block", marginBottom: 12, color: "#6c47ff", textDecoration: "none", fontWeight: 600 },
  newLink: { display: "block", color: "#999", textDecoration: "none", fontSize: 14 },
};
