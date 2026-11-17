import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { transitionDealRoom, updateEscrowChecklist } from "../../api/offMarketDeals";
import { getConversation } from "../../api/gigs";
import { authContext } from "../../context/authContext";

const CSS = `
.deal-room{background:#141418;border:1.5px solid #2a2a33;border-radius:8px;padding:20px;margin-top:20px;}
.deal-room h3{font-size:16px;font-weight:700;margin-bottom:12px;}
.deal-state{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;background:rgba(151, 71, 255,.12);color:#9747ff;margin-bottom:16px;}
.deal-room-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
.deal-room-btn{padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid #2a2a33;background:#1c1c22;color:#f0f0f4;}
.deal-room-btn:hover{border-color:#9747ff;color:#9747ff;}
.deal-audit{font-size:12px;color:#66667a;margin-top:16px;}
.deal-audit li{margin-bottom:6px;}
.escrow-list{list-style:none;padding:0;margin:0;}
.escrow-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #2a2a33;font-size:13px;}
.escrow-item input{width:16px;height:16px;}
.deal-room-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
.deal-room-head h3{margin:0;}
.deal-room-chat{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:#9747ff;color:#fff;}
.deal-room-chat:disabled{opacity:.6;cursor:default;}
.deal-room-btn.danger{border-color:#3a2226;color:#f87171;}
.deal-room-btn.danger:hover{border-color:#f87171;color:#f87171;}
.deal-room-note{font-size:12px;color:#8a8a9c;margin:-8px 0 16px;}
`;

const STATE_LABELS = {
  in_deal_room: "Enter Deal Room",
  under_contract: "Mark Under Contract",
  in_escrow: "Open Escrow",
  closed: "Mark Closed",
  cancelled: "Cancel deal",
};

// Used only if the API is older and doesn't send allowed_next_states.
const LEGACY_NEXT = {
  unlocked: ["in_deal_room"],
  in_deal_room: ["under_contract"],
  under_contract: ["in_escrow"],
  in_escrow: ["closed"],
};

export default function DealRoomPanel({ room, token, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const { openChatWithConversation } = useContext(authContext);

  if (!room) return null;

  const isSeller = room.role === "seller";
  const nextStates = Array.isArray(room.allowed_next_states)
    ? room.allowed_next_states
    : LEGACY_NEXT[room.state] || [];
  // Forward steps first, "Cancel deal" last.
  const transitions = [...nextStates].sort(
    (a, b) => (a === "cancelled") - (b === "cancelled")
  );
  const otherName = isSeller ? room.buyer_name || "the buyer" : room.seller_name || "the seller";

  const handleTransition = async (newState) => {
    if (newState === "cancelled" && !window.confirm("Cancel this deal? This can't be undone.")) {
      return;
    }
    setBusy(true);
    try {
      const updated = await transitionDealRoom(room.id, { new_state: newState }, token);
      onUpdate(updated);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Couldn't update the deal room.");
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    if (!room.conversation_id) return;
    setOpening(true);
    try {
      const res = await getConversation(token, room.conversation_id);
      openChatWithConversation(res.data);
    } catch (e) {
      toast.error("Couldn't open the chat. Please try again.");
    } finally {
      setOpening(false);
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
        <div className="deal-room-head">
          <h3>Deal Room</h3>
          {room.conversation_id && (
            <button type="button" className="deal-room-chat" onClick={openChat} disabled={opening}>
              {opening ? "Opening…" : `Message ${otherName}`}
            </button>
          )}
        </div>
        <span className="deal-state">{room.state.replace(/_/g, " ")}</span>

        {transitions.length > 0 && (
          <div className="deal-room-actions">
            {transitions.map((state) => (
              <button
                key={state}
                type="button"
                className={`deal-room-btn${state === "cancelled" ? " danger" : ""}`}
                disabled={busy}
                onClick={() => handleTransition(state)}
              >
                {STATE_LABELS[state] || state.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
        {!isSeller && room.role && room.state !== "closed" && room.state !== "cancelled" && (
          <p className="deal-room-note">
            The seller records contract, escrow and closing as the deal moves forward.
          </p>
        )}

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
