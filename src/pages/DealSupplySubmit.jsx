import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSupplySubmitMeta, submitSupplyDeal } from "../api/offMarketDeals";

const PAGE_CSS = `
.ds-page{min-height:100vh;background:#0d0d10;color:#f0f0f4;font-family:'DM Sans',sans-serif;padding:24px 16px 80px;}
.ds-inner{max-width:640px;margin:0 auto;}
.ds-hero{margin-bottom:24px;}
.ds-hero h1{font-size:26px;font-weight:800;margin-bottom:8px;}
.ds-hero h1 span{color:#f0318a;}
.ds-hero p{color:#66667a;font-size:14px;line-height:1.55;}
.ds-form{background:#141418;border:1.5px solid #2a2a33;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px;}
.ds-label{font-size:12px;font-weight:700;color:#b0b0c0;display:block;margin-bottom:4px;}
.ds-input,.ds-select,.ds-textarea{width:100%;background:#1c1c22;border:1px solid #2a2a33;border-radius:6px;padding:10px 12px;color:#f0f0f4;font-size:14px;box-sizing:border-box;}
.ds-textarea{min-height:90px;resize:vertical;}
.ds-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.ds-btn{margin-top:8px;padding:12px;border:none;border-radius:8px;background:#f0318a;color:#fff;font-weight:700;font-size:14px;cursor:pointer;}
.ds-btn:disabled{opacity:.5;cursor:not-allowed;}
.ds-msg{padding:12px;border-radius:8px;font-size:13px;}
.ds-msg.err{background:rgba(248,113,113,.12);color:#f87171;}
.ds-msg.ok{background:rgba(52,211,153,.12);color:#34d399;}
.ds-loading{text-align:center;padding:40px;color:#66667a;}
@media(max-width:560px){.ds-row{grid-template-columns:1fr}}
`;

const EMPTY = {
  submitter_name: "",
  submitter_email: "",
  submitter_phone: "",
  title: "",
  property_class: "residential",
  arv: "",
  asking_price: "",
  city: "",
  state: "",
  beds: "",
  teaser_summary: "",
  full_address: "",
  unlock_fee: "50",
  max_unlock_slots: "20",
  deadline_at: "",
};

export default function DealSupplySubmit() {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchSupplySubmitMeta(token)
      .then((data) => {
        setMeta(data);
        if (data.property_classes?.length) {
          setForm((f) => ({ ...f, property_class: data.property_classes[0] }));
        }
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || "This invite link is invalid or expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const deadline = form.deadline_at.includes("T")
        ? form.deadline_at
        : `${form.deadline_at}T23:59:59Z`;
      await submitSupplyDeal(token, {
        ...form,
        arv: form.arv,
        asking_price: form.asking_price,
        beds: form.beds ? Number(form.beds) : null,
        unlock_fee: form.unlock_fee || "50",
        max_unlock_slots: Number(form.max_unlock_slots) || 20,
        deadline_at: deadline,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not submit deal. Check your fields.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="ds-page">
          <div className="ds-loading">Checking invite…</div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="ds-page">
          <div className="ds-inner">
            <div className="ds-msg ok">
              Submitted — host will review. You&apos;ll hear from the listing host if approved.
            </div>
            <p style={{ marginTop: 16 }}>
              <Link to="/deals" style={{ color: "#f0318a" }}>
                Browse live deals
              </Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error && !meta) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="ds-page">
          <div className="ds-inner">
            <div className="ds-msg err">{error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="ds-page">
        <div className="ds-inner">
          <header className="ds-hero">
            <h1>
              Submit a <span>deal</span>
            </h1>
            <p>
              {meta?.label ? `${meta.label} — ` : ""}
              Hosted by {meta?.host_store || "PinkSurfing vendor"}. No vendor account required.
            </p>
          </header>

          <form className="ds-form" onSubmit={onSubmit}>
            {error && <div className="ds-msg err">{error}</div>}

            <div className="ds-row">
              <div>
                <label className="ds-label">Your name *</label>
                <input
                  className="ds-input"
                  required
                  value={form.submitter_name}
                  onChange={(e) => set("submitter_name", e.target.value)}
                />
              </div>
              <div>
                <label className="ds-label">Email *</label>
                <input
                  className="ds-input"
                  type="email"
                  required
                  value={form.submitter_email}
                  onChange={(e) => set("submitter_email", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="ds-label">Phone</label>
              <input
                className="ds-input"
                value={form.submitter_phone}
                onChange={(e) => set("submitter_phone", e.target.value)}
              />
            </div>

            <div>
              <label className="ds-label">Deal title *</label>
              <input
                className="ds-input"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Estate sale — 3bd Culver City"
              />
            </div>

            <div className="ds-row">
              <div>
                <label className="ds-label">Property class</label>
                <select
                  className="ds-select"
                  value={form.property_class}
                  onChange={(e) => set("property_class", e.target.value)}
                >
                  {(meta?.property_classes || ["residential"]).map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ds-label">Beds</label>
                <input
                  className="ds-input"
                  type="number"
                  min={0}
                  value={form.beds}
                  onChange={(e) => set("beds", e.target.value)}
                />
              </div>
            </div>

            <div className="ds-row">
              <div>
                <label className="ds-label">ARV *</label>
                <input
                  className="ds-input"
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={form.arv}
                  onChange={(e) => set("arv", e.target.value)}
                />
              </div>
              <div>
                <label className="ds-label">Asking price *</label>
                <input
                  className="ds-input"
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={form.asking_price}
                  onChange={(e) => set("asking_price", e.target.value)}
                />
              </div>
            </div>

            <div className="ds-row">
              <div>
                <label className="ds-label">City *</label>
                <input
                  className="ds-input"
                  required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <label className="ds-label">State *</label>
                <input
                  className="ds-input"
                  required
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="ds-label">Full address (locked until unlock)</label>
              <input
                className="ds-input"
                value={form.full_address}
                onChange={(e) => set("full_address", e.target.value)}
              />
            </div>

            <div>
              <label className="ds-label">Teaser summary</label>
              <textarea
                className="ds-textarea"
                value={form.teaser_summary}
                onChange={(e) => set("teaser_summary", e.target.value)}
              />
            </div>

            <div className="ds-row">
              <div>
                <label className="ds-label">Unlock fee ($)</label>
                <input
                  className="ds-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.unlock_fee}
                  onChange={(e) => set("unlock_fee", e.target.value)}
                />
              </div>
              <div>
                <label className="ds-label">Deadline *</label>
                <input
                  className="ds-input"
                  type="date"
                  required
                  value={form.deadline_at}
                  onChange={(e) => set("deadline_at", e.target.value)}
                />
              </div>
            </div>

            <button className="ds-btn" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit deal"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
