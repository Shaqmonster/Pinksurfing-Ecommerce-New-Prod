import React, { useState } from "react";
import { transitionDealRoom, updateEscrowChecklist } from "../../api/offMarketDeals";

const CSS = `
.deal-room{background:#141418;border:1.5px solid #2a2a33;border-radius:8px;padding:20px;margin-top:20px;}
.deal-room h3{font-size:16px;font-weight:700;margin-bottom:12px;}
.deal-state{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;background:rgba(240,49,138,.12);color:#f0318a;margin-bottom:16px;}
.deal-room-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
.deal-room-btn{padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid #2a2a33;background:#1c1c22;color:#f0f0f4;}
.deal-room-btn:hover{border-color:#f0318a;color:#f0318a;}
.deal-audit{font-size:12px;color:#66667a;margin-top:16px;}
.deal-audit li{margin-bottom:6px;}
.escrow-list{list-style:none;padding:0;margin:0;}
.escrow-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #2a2a33;font-size:13px;}
.escrow-item input{width:16px;height:16px;}
`;

const NEXT_STATES = {
  unlocked: [{ state: "in_deal_room", label: "Enter Deal Room" }],
  in_deal_room: [{ state: "under_contract", label: "Mark Under Contract" }],
  under_contract: [{ state: "in_escrow", label: "Open Escrow" }],
  in_escrow: [{ state: "closed", label: "Mark Closed" }],
};

export default function DealRoomPanel({ room, token, onUpdate }) {
  const [busy, setBusy] = useState(false);

  if (!room) return null;

  const transitions = NEXT_STATES[room.state] || [];

  const handleTransition = async (newState) => {
    setBusy(true);
    try {
      const updated = await transitionDealRoom(room.id, { new_state: newState }, token);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleChecklist = async (id) => {
    const checklist = (room.escrow_checklist || []).map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setBusy(true);
    try {
      const updated = await updateEscrowChecklist(room.id, checklist, token);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <section className="deal-room">
        <h3>Deal Room</h3>
        <span className="deal-state">{room.state.replace(/_/g, " ")}</span>

        <div className="deal-room-actions">
          {transitions.map((t) => (
            <button
              key={t.state}
              type="button"
              className="deal-room-btn"
              disabled={busy}
              onClick={() => handleTransition(t.state)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {room.escrow_checklist?.length > 0 && (
          <>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Escrow Packet</h4>
            <ul className="escrow-list">
              {room.escrow_checklist.map((item) => (
                <li key={item.id} className="escrow-item">
                  <input
                    type="checkbox"
                    checked={Boolean(item.done)}
                    onChange={() => toggleChecklist(item.id)}
                    disabled={busy}
                  />
                  <span style={{ color: item.done ? "#34d399" : "#b0b0c0" }}>{item.label}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {room.state_history?.length > 0 && (
          <div className="deal-audit">
            <strong>Audit trail</strong>
            <ul>
              {room.state_history.slice(-5).map((entry, i) => (
                <li key={i}>
                  {entry.from} → {entry.to} · {new Date(entry.at).toLocaleString()}
                  {entry.note ? ` — ${entry.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
