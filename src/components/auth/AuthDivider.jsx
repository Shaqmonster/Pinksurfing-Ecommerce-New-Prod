const AuthDivider = ({ label = "or" }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-200" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-3 bg-white text-slate-500">{label}</span>
    </div>
  </div>
);

export default AuthDivider;
