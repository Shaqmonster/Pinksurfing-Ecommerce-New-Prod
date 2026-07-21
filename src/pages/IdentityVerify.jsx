import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DiditVerificationGate from "../components/DiditVerificationGate";

const IdentityVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  return (
    <div className="min-h-[60vh] bg-[#0a0a0f]">
      <DiditVerificationGate
        onVerified={() => navigate(returnUrl, { replace: true })}
        title="Identity verification"
        description="Finish verification to continue. This is required once for selling as a vendor or gig worker."
      >
        {() => (
          <div className="text-center py-12 text-green-400">
            Verified. Redirecting…
          </div>
        )}
      </DiditVerificationGate>
    </div>
  );
};

export default IdentityVerify;
