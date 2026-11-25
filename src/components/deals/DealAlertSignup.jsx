import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchDealAlert, saveDealAlert, turnOffDealAlert } from "../../api/offMarketDeals";
import { authContext } from "../../context/authContext";

const PROPERTY_TYPES = [
  { id: "", label: "Any property type" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "multi_family", label: "Multi-Family" },
  { id: "land", label: "Land" },
  { id: "industrial", label: "Industrial" },
  { id: "wholesale", label: "Wholesale" },
];

const CSS = `
.deal-alert{margin-top:20px;border:1px solid rgba(151,71,255,.35);background:linear-gradient(135deg,rgba(151,71,255,.10),rgba(236,72,153,.06));border-radius:12px;padding:20px;}
.deal-alert h2{font-size:16px;font-weight:800;color:var(--ps-color-text);margin:0 0 4px;}
.deal-alert p{font-size:13px;color:var(--ps-color-text-secondary);margin:0 0 14px;line-height:1.5;}
.deal-alert form{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:end;}
.deal-alert label{display:block;font-size:11px;font-weight:600;color:var(--ps-color-text-secondary);margin-bottom:4px;}
.deal-alert input,.deal-alert select{width:100%;height:40px;border-radius:8px;border:1px solid var(--ps-color-border);background:var(--ps-color-surface);color:var(--ps-color-text);padding:0 10px;font-size:13px;}
.deal-alert input:focus,.deal-alert select:focus{outline:none;border-color:var(--ps-primary);}
.deal-alert .btn{height:40px;border:none;border-radius:8px;background:var(--ps-primary);color:#fff;font-weight:700;font-size:13px;cursor:pointer;padding:0 16px;}
.deal-alert .btn:disabled{opacity:.6;cursor:default;}
.deal-alert .link{background:none;border:none;color:var(--ps-color-text-secondary);font-size:12px;text-decoration:underline;cursor:pointer;padding:0;margin-top:10px;}
.deal-alert .on{font-size:12px;color:var(--ps-color-success);font-weight:600;margin-bottom:10px;}
.deal-alert a{color:var(--ps-color-action-text);font-weight:700;text-decoration:none;}
`;

/** "Email me new deals" box for the Deals page (UAT P2.14). */
export default function DealAlertSignup({ token }) {
  const [form, setForm] = useState({ property_class: "", state: "", max_price: "" });
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  // Alerts go to the signed-in account's email; say which one (retest N2.12).
  const { user } = useContext(authContext);
  const email = user?.email || "";

  useEffect(() => {
    if (!token) return;
    fetchDealAlert(token)
      .then((a) => {
        setActive(Boolean(a?.active));
        if (a?.active) {
          setForm({
            property_class: a.property_class || "",
            state: a.state || "",
            max_price: a.max_price ? String(Math.round(Number(a.max_price))) : "",
          });
        }
      })
      .catch(() => {});
  }, [token]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const a = await saveDealAlert(token, form);
      setActive(Boolean(a?.active));
      toast.success(
        email
          ? `Deal alert saved. We'll email ${email} when a matching deal goes live.`
          : "Deal alert saved. We'll email you when a matching deal goes live."
      );
    } catch (err) {
      const data = err?.response?.data;
      const msg = data && typeof data === "object" ? Object.values(data).flat().join(" ") : "";
      toast.error(msg || "Couldn't save your deal alert. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onTurnOff = async () => {
    setSaving(true);
    try {
      await turnOffDealAlert(token);
      setActive(false);
      toast.info("Deal alert turned off.");
    } catch {
      toast.error("Couldn't turn off your deal alert. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="deal-alert" aria-labelledby="deal-alert-title">
      <style>{CSS}</style>
      <h2 id="deal-alert-title">Get new deals by email</h2>
      <p>
        We&apos;ll email you when a new off-market deal that matches goes live. The address stays
        hidden until you unlock it.
      </p>
      {!token ? (
        <p style={{ margin: 0 }}>
          <Link to="/signin">Sign in</Link> to set up a deal alert.
        </p>
      ) : (
        <>
          {active && <div className="on">✓ Your deal alert is on</div>}
          {email && (
            <p style={{ margin: "0 0 12px" }}>
              Alerts go to <strong style={{ color: "var(--ps-color-text)" }}>{email}</strong>, the email on your
              account.
            </p>
          )}
          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="da-type">Property type</label>
              <select id="da-type" value={form.property_class} onChange={set("property_class")}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="da-state">State (optional)</label>
              <input
                id="da-state"
                value={form.state}
                onChange={set("state")}
                maxLength={60}
                placeholder="e.g. TX"
              />
            </div>
            <div>
              <label htmlFor="da-price">Max asking price (optional)</label>
              <input
                id="da-price"
                type="number"
                min="1"
                step="1000"
                inputMode="numeric"
                value={form.max_price}
                onChange={set("max_price")}
                placeholder="e.g. 500000"
              />
            </div>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving…" : active ? "Update alert" : "Email me new deals"}
            </button>
          </form>
          {active && (
            <button type="button" className="link" onClick={onTurnOff} disabled={saving}>
              Turn off deal alerts
            </button>
          )}
        </>
      )}
    </section>
  );
}
