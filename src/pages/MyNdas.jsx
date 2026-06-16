import React, { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAccessToken } from "../hooks/useAccessToken";

const BASE = import.meta.env.VITE_SERVER_URL;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

const BUYER_FINANCIALS_PAGE_TITLE = "My Business Financials Requests";
const BUYER_FINANCIALS_PAGE_SUB =
  "Request more information on businesses for sale. Sign the NDA, pay the $1 fee, and view the unlocked financial documents tied to each listing.";

const STATUS_LABEL = {
  pending_vendor:   "Awaiting Seller Review",
  accepted:         "Unlocked — Financials Available",
  rejected:         "Rejected & Refunded",
  disputed:         "Disputed",
  dispute_refunded: "Closed (Refunded)",
};

const STATUS_COLOR = {
  pending_vendor:   { bg: "#fff8e1", text: "#b45309", border: "#fcd34d" },
  accepted:         { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  rejected:         { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
  disputed:         { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" },
  dispute_refunded: { bg: "#f9fafb", text: "#6b7280", border: "#d1d5db" },
};

const DOC_TYPE_LABEL = {
  pl_statement:        "P&L Statement",
  tax_returns:         "Tax Returns",
  revenue_breakdown:   "Revenue Breakdown",
  cim:                 "CIM / Info Memorandum",
  bank_statements:     "Bank Statements",
  lease_agreement:     "Lease Agreement",
  franchise_agreement: "Franchise / Operating Agreement",
  asset_list:          "Asset List",
  other:               "Document",
};

async function fetchMyNdas(token) {
  const res = await axios.get(`${BASE}/api/nda/mine/`, { headers: authHeader(token) });
  return res.data;
}

async function raiseDispute(token, ndaId, reason) {
  const res = await axios.post(
    `${BASE}/api/nda/${ndaId}/dispute/`,
    { dispute_reason: reason },
    { headers: authHeader(token) }
  );
  return res.data;
}

function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export default function MyNdas() {
  const accessToken = useAccessToken();
  const [cookies] = useCookies(["access_token"]);
  const navigate   = useNavigate();
  const token      = accessToken;

  const [ndas, setNdas]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [disputeOpen, setDisputeOpen] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeErr, setDisputeErr] = useState(null);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyNdas(token);
      setNdas(data);
    } catch {
      setError("Could not load your business financials requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function submitDispute(ndaId) {
    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      setDisputeErr("Please provide a reason (at least 10 characters).");
      return;
    }
    setDisputeBusy(true);
    setDisputeErr(null);
    try {
      const updated = await raiseDispute(token, ndaId, disputeReason.trim());
      setNdas((n) => n.map((x) => (x.id === updated.id ? updated : x)));
      setDisputeOpen(null);
      setDisputeReason("");
    } catch (e) {
      setDisputeErr(e?.response?.data?.detail || "Could not raise dispute.");
    } finally {
      setDisputeBusy(false);
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0d0d12",
      color: "#e8e8ee",
      padding: "32px 16px 80px",
      fontFamily: "'Inter', sans-serif",
    },
    container: { maxWidth: 860, margin: "0 auto" },
    heading: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 },
    sub: { fontSize: 14, color: "#8888a0", marginBottom: 32 },
    card: {
      background: "#17171f",
      border: "1px solid #2a2a38",
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      position: "relative",
    },
    badge: (s) => ({
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      background: STATUS_COLOR[s]?.bg || "#1e1e2e",
      color: STATUS_COLOR[s]?.text || "#aaa",
      border: `1px solid ${STATUS_COLOR[s]?.border || "#333"}`,
      marginBottom: 8,
    }),
    listingName: {
      fontSize: 19,
      fontWeight: 700,
      color: "#fff",
      marginBottom: 8,
    },
    meta: { fontSize: 13, color: "#8888a0", marginBottom: 3 },
    divider: { borderTop: "1px solid #2a2a38", margin: "16px 0" },
    docRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1e1e2e",
      border: "1px solid #2a2a38",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 8,
    },
    docName: { fontSize: 14, fontWeight: 600, color: "#fff" },
    docMeta: { fontSize: 11, color: "#666", marginTop: 2 },
    viewBtn: {
      fontSize: 12,
      color: "#e040a8",
      textDecoration: "none",
      fontWeight: 600,
      padding: "4px 10px",
      border: "1px solid #e040a8",
      borderRadius: 8,
    },
    actionBtn: (variant) => ({
      padding: "8px 18px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      border: variant === "outline" ? "1px solid #2a2a38" : "none",
      background:
        variant === "danger"
          ? "#7f1d1d"
          : variant === "primary"
          ? "linear-gradient(135deg,#e040a8,#9b59b6)"
          : "transparent",
      color: variant === "outline" ? "#aaa" : "#fff",
    }),
    disputeBox: {
      background: "#1e1e2e",
      border: "1px solid #fdba74",
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    textarea: {
      width: "100%",
      background: "#0d0d12",
      border: "1px solid #2a2a38",
      borderRadius: 8,
      color: "#fff",
      fontSize: 13,
      padding: "10px 12px",
      resize: "vertical",
      minHeight: 80,
      marginTop: 8,
      boxSizing: "border-box",
    },
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.heading}>{BUYER_FINANCIALS_PAGE_TITLE}</h1>
          <p style={styles.sub}>Please sign in to view your unlocked business financials.</p>
          <button
            style={styles.actionBtn("primary")}
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>{BUYER_FINANCIALS_PAGE_TITLE}</h1>
        <p style={styles.sub}>{BUYER_FINANCIALS_PAGE_SUB}</p>

        {error && (
          <div style={{ color: "#f87171", marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#8888a0" }}>Loading…</p>
        ) : ndas.length === 0 ? (
          <div
            style={{
              background: "#17171f",
              border: "1px solid #2a2a38",
              borderRadius: 16,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 32 }}>📄</p>
            <p style={{ color: "#ccc", fontWeight: 600, marginTop: 8 }}>
              No business financials requests yet
            </p>
            <p style={{ color: "#8888a0", fontSize: 13, marginTop: 4 }}>
              When you sign an NDA and unlock financials for a business listing, it will appear here with your signed agreement and documents.
            </p>
          </div>
        ) : (
          ndas.map((nda) => {
            const color = STATUS_COLOR[nda.status] || {};
            const isAccepted = nda.status === "accepted";
            const isDisputed = nda.status === "disputed";
            const allDocs = [
              ...(nda.listing_documents || []),
              ...(nda.documents || []),
            ];

            return (
              <div key={nda.id} style={styles.card}>
                {/* Status */}
                <span style={styles.badge(nda.status)}>
                  {STATUS_LABEL[nda.status] || nda.status}
                </span>

                {/* Listing name + link */}
                <div style={styles.listingName}>{nda.product_name}</div>

                <div style={styles.meta}>NDA signed: {fmt(nda.signed_at)}</div>
                {nda.vendor_accepted_at && (
                  <div style={styles.meta}>Accepted by seller: {fmt(nda.vendor_accepted_at)}</div>
                )}
                {nda.rejection_reason && (
                  <div style={{ ...styles.meta, color: "#f87171" }}>
                    Rejection reason: {nda.rejection_reason}
                  </div>
                )}
                {nda.refunded_at && (
                  <div style={{ ...styles.meta, color: "#86efac" }}>
                    Refunded: {fmt(nda.refunded_at)}
                  </div>
                )}
                {nda.dispute_reason && (
                  <div style={{ ...styles.meta, color: "#fdba74" }}>
                    Dispute raised: {nda.dispute_reason}
                  </div>
                )}

                {/* View listing — always pass productId so detail page can load (inactive/slug edge cases) */}
                {nda.product_id && (
                  <Link
                    to={`/product/productDetail/${encodeURIComponent(nda.product_slug || nda.product_id)}?productId=${nda.product_id}`}
                    style={{ fontSize: 12, color: "#e040a8", marginTop: 4, display: "inline-block" }}
                  >
                    View listing →
                  </Link>
                )}

                {/* Documents (accepted only) */}
                {isAccepted && allDocs.length > 0 && (
                  <>
                    <div style={styles.divider} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 10 }}>
                      Unlocked Financial Documents
                    </p>
                    {allDocs.map((doc) => (
                      <div key={doc.id} style={styles.docRow}>
                        <div>
                          <div style={styles.docName}>{doc.document_name}</div>
                          <div style={styles.docMeta}>
                            {DOC_TYPE_LABEL[doc.document_type] || doc.document_type} · Uploaded {fmt(doc.uploaded_at)}
                          </div>
                        </div>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.viewBtn}
                        >
                          View / Download
                        </a>
                      </div>
                    ))}
                  </>
                )}

                {/* Accepted but no docs yet — invite dispute */}
                {isAccepted && allDocs.length === 0 && (
                  <>
                    <div style={styles.divider} />
                    <p style={{ fontSize: 13, color: "#8888a0" }}>
                      Your NDA is on file but the seller has not uploaded financial
                      files for this listing yet. You can raise a dispute for a refund
                      if documents are not provided.
                    </p>
                    <button
                      style={{ ...styles.actionBtn("danger"), marginTop: 12 }}
                      onClick={() => {
                        setDisputeOpen(nda.id);
                        setDisputeReason("");
                        setDisputeErr(null);
                      }}
                    >
                      Raise a Dispute
                    </button>
                  </>
                )}

                {/* Dispute form */}
                {disputeOpen === nda.id && (
                  <div style={styles.disputeBox}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#fdba74", marginBottom: 4 }}>
                      Raise a Dispute
                    </p>
                    <p style={{ fontSize: 12, color: "#8888a0" }}>
                      Explain why you are raising a dispute. Our team will review and may issue a refund.
                    </p>
                    <textarea
                      style={styles.textarea}
                      placeholder="e.g. The seller accepted but has not shared any documents for 5 days."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                    {disputeErr && (
                      <p style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>{disputeErr}</p>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        disabled={disputeBusy}
                        style={{ ...styles.actionBtn("danger"), opacity: disputeBusy ? 0.5 : 1 }}
                        onClick={() => submitDispute(nda.id)}
                      >
                        {disputeBusy ? "Submitting…" : "Submit Dispute"}
                      </button>
                      <button
                        style={styles.actionBtn("outline")}
                        onClick={() => { setDisputeOpen(null); setDisputeReason(""); setDisputeErr(null); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Already disputed */}
                {isDisputed && (
                  <div style={{ ...styles.disputeBox, borderColor: "#fdba74", marginTop: 12 }}>
                    <p style={{ fontSize: 13, color: "#fdba74", fontWeight: 600 }}>Dispute Raised</p>
                    <p style={{ fontSize: 12, color: "#8888a0", marginTop: 4 }}>
                      Our team is reviewing your dispute. You will be notified by email.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
