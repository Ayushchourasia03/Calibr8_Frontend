import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    register
  } = useCalibr8();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authMode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      setAuthModalOpen(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await login({ email: "jane@example.com", password: "password123" });
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to log in to demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0e162f] to-[#040813] p-6 text-white shadow-2xl">
        <button
          onClick={() => {
            setAuthModalOpen(false);
            setError("");
          }}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10"
        >
          ×
        </button>

        <div className="mb-6 text-center">
          <div className="text-2xl font-bold font-serif tracking-tight text-white mb-1">
            Calibr<span className="text-blue-500">8</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-200">
            {authMode === "login" ? "Welcome Back" : "Create Your Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === "login"
              ? "Sign in to sync your calibrated rank, streak, and solves."
              : "Calibrate your growth with verified daily problem tracking."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading
              ? "Authenticating..."
              : authMode === "login"
              ? "Sign In"
              : "Register Account"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setAuthMode(authMode === "login" ? "register" : "login");
            }}
            className="font-semibold text-cyan-300 hover:underline"
          >
            {authMode === "login" ? "Create one" : "Sign In"}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full rounded-xl border border-cyan-500/30 bg-cyan-950/20 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-950/40 transition"
          >
            Demo Sign-In (jane@example.com)
          </button>
        </div>
      </div>
    </div>
  );
}