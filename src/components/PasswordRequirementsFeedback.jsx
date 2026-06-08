import React from "react";
import { evaluatePasswordRules } from "../utils/djangoPasswordValidation";

const RuleIcon = ({ passed }) => {
  if (passed) {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-emerald-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const PasswordRequirementsFeedback = ({
  password,
  userContext = {},
  visible = true,
}) => {
  if (!visible || !password) return null;

  const rules = evaluatePasswordRules(password, userContext);

  return (
    <div
      className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
      aria-live="polite"
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Password requirements
      </p>
      <ul className="space-y-1.5">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-start gap-2 text-xs leading-snug ${
              rule.passed ? "text-emerald-700" : "text-slate-600"
            }`}
          >
            <RuleIcon passed={rule.passed} />
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirementsFeedback;
