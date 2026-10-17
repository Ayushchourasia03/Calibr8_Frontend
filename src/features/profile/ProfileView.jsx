import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { api, apiConfig } from "../../services/api";

export function ProfileView() {
  const {
    state,
    getTier,
    user,
    updateProfileName,
    changePassword,
    logout,
    setLevelModalOpen,
    setAuthModalOpen,
    setAuthMode
  } = useCalibr8();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [nameStatus, setNameStatus] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Separate backend URL management
  const [backendUrl, setBackendUrl] = useState(apiConfig.getBaseUrl() || "");
  const [connectionStatus, setConnectionStatus] = useState({ state: "idle", message: "" });


  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setNameStatus("Saving...");
    try {
      await updateProfileName(nameInput.trim());
      setIsEditingName(false);
      setNameStatus("Name updated successfully!");
      setTimeout(() => setNameStatus(""), 3000);
    } catch (err) {
      setNameStatus(err.message || "Failed to update name.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus("");
    setIsSubmittingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordStatus("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
      setTimeout(() => setPasswordStatus(""), 4000);
    } catch (err) {
      setPasswordStatus(err.message || "Failed to change password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleTestBackend = async () => {
    setConnectionStatus({ state: "testing", message: "Connecting to API..." });
    try {
      apiConfig.setBaseUrl(backendUrl);
      const res = await api.system.health();
      setConnectionStatus({
        state: "success",
        message: `Connected! Service: ${res.service || "Online"} (Status: ${res.status})`
      });
    } catch (err) {
      setConnectionStatus({
        state: "error",
        message: `Connection failed: ${err.message}`
      });
    }
  };

  const handleResetBackend = () => {
    apiConfig.setBaseUrl("");
    setBackendUrl("");
    setConnectionStatus({ state: "idle", message: "Reset to default endpoint." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">
            User Profile & Calibration
          </h1>
          <p className="text-xs text-slate-400">
            Manage your account credentials, backend API connection, and calibrated topic targets.
          </p>
        </div>

        {user ? (
          <button
            onClick={logout}
            className="rounded-full border border-red-500/30 bg-red-950/20 px-4 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition"
          >
            Log Out
          </button>
        ) : (
          <button
            onClick={() => {
              setAuthMode("login");
              setAuthModalOpen(true);
            }}
            className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25"
          >
            Sign In / Register
          </button>
        )}
      </div>

      {/* Account Settings & Profile Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Account Details</h2>
            <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 text-[10px] text-cyan-300">
              {user?.onboarded ? "Calibrated & Onboarded" : "Guest Session"}
            </span>
          </div>

          {user ? (
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-slate-400">Full Name:</div>
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-black/60 px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="rounded bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-white">{user.name}</span>
                    <button
                      onClick={() => {
                        setNameInput(user.name);
                        setIsEditingName(true);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {nameStatus && <p className="text-[11px] text-cyan-300 mt-1">{nameStatus}</p>}
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Email Address:</div>
                <div className="text-sm text-slate-200 mt-0.5">{user.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Calibrated Rating:</div>
                  <div className="text-base font-bold text-cyan-300">{user.rating || state.rating}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Current Tier:</div>
                  <div className="text-base font-bold text-white">{getTier()}</div>
                </div>
              </div>

              {/* Password Change Toggle */}
              <div className="pt-2 border-t border-slate-800">
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="text-xs text-slate-400 hover:text-cyan-300 underline"
                  >
                    Change Account Password
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-2 mt-2">
                    <h3 className="text-xs font-semibold text-slate-300">Change Password</h3>
                    <input
                      type="password"
                      placeholder="Current Password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <input
                      type="password"
                      placeholder="New Password (min 6 chars)"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingPassword}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {isSubmittingPassword ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                {passwordStatus && (
                  <p className="text-[11px] text-cyan-300 mt-2">{passwordStatus}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-3">
              <p className="text-xs text-slate-400">
                You are currently browsing in guest mode. Sign in or register to sync your calibration to the cloud.
              </p>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthModalOpen(true);
                }}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Calibrated Topics & Levels */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Target Topics & Difficulty</h2>
            <button
              onClick={() => setLevelModalOpen(true)}
              className="text-xs text-cyan-400 hover:underline"
            >
              Recalibrate
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {user?.topics && user.topics.length > 0 ? (
              user.topics.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                >
                  <span className="font-medium text-slate-200">
                    {t.topic?.name || t.topicId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-cyan-300 capitalize">
                      {t.difficulty || "calibrated"}
                    </span>
                    <span className="font-mono text-slate-400">
                      {t.rating || 800}
                    </span>
                  </div>
                </div>
              ))
            ) : Object.keys(state.levels || {}).length > 0 ? (
              Object.keys(state.levels).map((topicName) => (
                <div
                  key={topicName}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                >
                  <span className="font-medium text-slate-200">{topicName}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                      Level {state.levels[topicName]}
                    </span>
                    <span className="font-mono text-slate-400">
                      {state.ratings?.[topicName] || 800}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No topics configured yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Backend API Connection Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Backend API Server Connection</h2>
          <span className="text-[10px] text-slate-400 font-mono">
            {backendUrl ? "Custom Endpoint" : "Local / Same-Origin Default"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          If your separate Calibr8 backend is running on a different port (e.g. <code>http://localhost:5000</code>) or external server URL, enter it below.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:5000 (leave blank for local / same-origin)"
            className="flex-1 rounded-xl border border-slate-700 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleTestBackend}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-90 transition whitespace-nowrap"
          >
            Save & Test Connection
          </button>
          {backendUrl && (
            <button
              onClick={handleResetBackend}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              Reset
            </button>
          )}
        </div>

        {connectionStatus.message && (
          <div
            className={`mt-3 rounded-lg p-2.5 text-xs ${
              connectionStatus.state === "success"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                : connectionStatus.state === "error"
                ? "bg-red-950/40 border border-red-500/30 text-red-300"
                : "bg-blue-950/40 border border-blue-500/30 text-blue-300"
            }`}
          >
            {connectionStatus.message}
          </div>
        )}
      </div>

      {/* Social Badges & Sharing */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LinkedIn Share Badge */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white mb-4">
            LinkedIn Verified Badge
          </h2>
          <div className="rounded-xl bg-gradient-to-br from-[#031433] to-[#0a3a8a] p-5 text-white shadow-xl">
            <div className="text-[10px] font-mono tracking-widest text-cyan-300">
              CALIBR8 CERTIFIED
            </div>
            <h3 className="text-xl font-bold font-serif my-1">
              {user?.name || "Candidate Profile"}
            </h3>
            <div className="text-xs text-slate-200">
              Tier {getTier()} • Rating {user?.rating || state.rating}
            </div>
            <div className="text-xs text-slate-300 mt-2">
              Verified Solves: {state.solves || 0} • Streak: {state.streak} days
            </div>
            <div className="mt-4 inline-block rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-400/30">
              Strict-Mode Verified
            </div>
          </div>
        </div>

        {/* Instagram Story Clip */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white mb-4">
            Social Milestone Card
          </h2>
          <div className="mx-auto flex h-60 w-36 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 p-4 text-center text-white shadow-xl">
            <span className="text-xs tracking-wider opacity-80 uppercase">
              Rank Up
            </span>
            <span className="text-xl font-bold my-1">{getTier()}</span>
            <span className="text-[10px] opacity-90">
              {state.streak}-day streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
