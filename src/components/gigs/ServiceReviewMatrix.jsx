const DIMS = [
  { k: "respect", label: "Respectfulness & attitude (10%)" },
  { k: "comm", label: "Communication quality (5%)" },
  { k: "timeliness", label: "Timeliness of work (30%)" },
  { k: "quality", label: "Quality of work (55%)" },
];

export function defaultServiceScores() {
  return { respect: 6, comm: 6, timeliness: 6, quality: 6 };
}

export function defaultUnhappyServiceScores() {
  return { respect: 2, comm: 2, timeliness: 1, quality: 2 };
}

export default function ServiceReviewMatrix({ id = "service-review", title, values, onChange, disabled }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      {title ? <h4 className="text-white/80 text-xs font-semibold mb-2">{title}</h4> : null}
      <p className="text-[11px] text-white/45 mb-3">
        1-7 each. Weighted overall uses R/C/Q + timeliness exactly like contract workflow.
      </p>
      <div className="space-y-2.5">
        {DIMS.map(({ k, label }) => (
          <div key={k}>
            <span id={`${id}-${k}-lbl`} className="text-[11px] text-white/60 block mb-1">
              {label}
            </span>
            <div className="flex flex-wrap gap-1" role="group" aria-labelledby={`${id}-${k}-lbl`}>
              {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...values, [k]: star })}
                  className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                    values[k] === star
                      ? "bg-purple-500/25 border-purple-400/40 text-purple-200"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  } disabled:opacity-50`}
                >
                  {star}*
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
