import React from "react";

const CSS = `
.deal-process{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:28px;}
@media(max-width:900px){.deal-process{grid-template-columns:1fr 1fr;}}
.deal-step{background:#141418;border:1px solid #2a2a33;border-radius:8px;padding:14px 16px;}
.deal-step-num{font-size:10px;font-weight:800;color:#f0318a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;}
.deal-step-title{font-size:13px;font-weight:700;color:#f0f0f4;margin-bottom:4px;}
.deal-step-desc{font-size:12px;color:#66667a;line-height:1.45;}
`;

const STEPS = [
  {
    n: "01",
    title: "See ARV & Spread",
    desc: "Browse off-market deals with ARV, spread, and deadline visible before unlock.",
  },
  {
    n: "02",
    title: "Pay to Unlock",
    desc: "Deposit unlock fee — credited toward closing costs when you close.",
  },
  {
    n: "03",
    title: "Enter Deal Room",
    desc: "Business chat with state machine and full audit trail.",
  },
  {
    n: "04",
    title: "Close & Settle",
    desc: "Escrow packet, funds settled, PS fee disbursed.",
  },
];

export default function DealProcessStrip() {
  return (
    <>
      <style>{CSS}</style>
      <div className="deal-process">
        {STEPS.map((s) => (
          <div key={s.n} className="deal-step">
            <div className="deal-step-num">Step {s.n}</div>
            <div className="deal-step-title">{s.title}</div>
            <div className="deal-step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
