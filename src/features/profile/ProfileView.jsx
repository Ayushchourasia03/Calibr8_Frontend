// import { useEffect, useState } from "react";
// import { api } from "../../services/api";
// import { useCalibr8 } from "../../context/Calibr8Context";
// // imports
// import { ConnectedAccounts } from "./ConnectedAccounts";

// // inside the component, after the useCalibr8() destructure
// const linkedAvatar = (user?.socialAccounts || []).find((a) => a.avatarUrl)?.avatarUrl;
// const GithubIcon = () => (
//   <svg viewBox="0 0 16 16" className="h-5 w-5 fill-current" aria-hidden="true">
//     <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
//   </svg>
// );

// const LinkedinIcon = () => (
//   <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0a66c2] text-[11px] font-bold leading-none text-white">
//     in
//   </span>
// );

// const PROVIDERS = [
//   {
//     id: "github",
//     label: "GitHub",
//     Icon: GithubIcon,
//     blurb: "Show your repos and followers on your profile.",
//   },
//   {
//     id: "linkedin",
//     label: "LinkedIn",
//     Icon: LinkedinIcon,
//     blurb: "Verify your identity and use your photo on your badge.",
//   },
// ];

// function Avatar({ src, name }) {
//   const [failed, setFailed] = useState(false);
//   const initials = (name || "?")
//     .split(" ")
//     .map((p) => p[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

//   if (!src || failed) {
//     return (
//       <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-blue-500/20 text-sm font-bold text-cyan-200">
//         {initials}
//       </div>
//     );
//   }
//   return (
//     <img
//       src={src}
//       alt={name || "Profile"}
//       referrerPolicy="no-referrer"
//       onError={() => setFailed(true)}
//       className="h-14 w-14 rounded-full border border-cyan-400/40 object-cover"
//     />
//   );
// }

// function Stat({ label, value }) {
//   return (
//     <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-center">
//       <div className="text-sm font-bold text-white">{value ?? 0}</div>
//       <div className="text-[10px] text-slate-400">{label}</div>
//     </div>
//   );
// }

// export function ConnectedAccounts({ onRequireAuth }) {
//   const { user, refreshUser } = useCalibr8();
//   const [busy, setBusy] = useState(null); // provider id currently working
//   const [status, setStatus] = useState({ type: "", message: "" });

//   const accounts = user?.socialAccounts || [];
//   const byProvider = Object.fromEntries(accounts.map((a) => [a.provider, a]));

//   // Handle redirect back from OAuth: /?linked=github or /?link_error=...
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const linked = params.get("linked");
//     const linkError = params.get("link_error");
//     if (!linked && !linkError) return;

//     window.history.replaceState({}, "", window.location.pathname);

//     if (linkError) {
//       setStatus({ type: "error", message: linkError });
//       return;
//     }
//     refreshUser?.()
//       .then(() =>
//         setStatus({ type: "success", message: `${linked} connected successfully.` }),
//       )
//       .catch(() =>
//         setStatus({ type: "error", message: "Linked, but failed to refresh profile." }),
//       );
//   }, [refreshUser]);

//   const handleConnect = async (provider) => {
//     if (!user) {
//       onRequireAuth?.();
//       return;
//     }
//     setBusy(provider);
//     setStatus({ type: "", message: "" });
//     try {
//       const { url } = await api.social.getLinkUrl(provider);
//       window.location.href = url; // leaves the app for the provider's consent screen
//     } catch (err) {
//       setStatus({ type: "error", message: err.message || "Could not start linking." });
//       setBusy(null);
//     }
//   };

//   const handleDisconnect = async (provider) => {
//     if (!window.confirm(`Disconnect ${provider}?`)) return;
//     setBusy(provider);
//     setStatus({ type: "", message: "" });
//     try {
//       await api.social.unlink(provider);
//       await refreshUser?.();
//       setStatus({ type: "success", message: `${provider} disconnected.` });
//     } catch (err) {
//       setStatus({ type: "error", message: err.message || "Failed to disconnect." });
//     } finally {
//       setBusy(null);
//     }
//   };

//   return (
//     <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4">
//       <div>
//         <h2 className="text-sm font-semibold text-white">Connected Accounts</h2>
//         <p className="text-xs text-slate-400">
//           Link your developer and professional profiles to enrich your Calibr8 identity.
//         </p>
//       </div>

//       {status.message && (
//         <div
//           className={`rounded-lg p-2.5 text-xs ${
//             status.type === "error"
//               ? "border border-red-500/30 bg-red-950/40 text-red-300"
//               : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
//           }`}
//         >
//           {status.message}
//         </div>
//       )}

//       <div className="grid gap-4 md:grid-cols-2">
//         {PROVIDERS.map(({ id, label, Icon, blurb }) => {
//           const account = byProvider[id];
//           const isBusy = busy === id;

//           return (
//             <div
//               key={id}
//               className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-sm font-semibold text-white">
//                   <Icon />
//                   {label}
//                 </div>
//                 {account && (
//                   <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
//                     Connected
//                   </span>
//                 )}
//               </div>

//               {account ? (
//                 <>
//                   <div className="flex items-center gap-3">
//                     <Avatar src={account.avatarUrl} name={account.name || account.username} />
//                     <div className="min-w-0">
//                       <div className="truncate text-sm font-semibold text-white">
//                         {account.name || account.username}
//                       </div>
//                       {account.username && (
//                         <div className="truncate text-[11px] text-slate-400">
//                           @{account.username}
//                         </div>
//                       )}
//                       {account.email && (
//                         <div className="truncate text-[11px] text-slate-500">
//                           {account.email}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {(account.bio || account.headline) && (
//                     <p className="line-clamp-2 text-xs text-slate-300">
//                       {account.bio || account.headline}
//                     </p>
//                   )}

//                   {id === "github" && account.stats && (
//                     <div className="grid grid-cols-3 gap-2">
//                       <Stat label="Repos" value={account.stats.publicRepos} />
//                       <Stat label="Followers" value={account.stats.followers} />
//                       <Stat label="Following" value={account.stats.following} />
//                     </div>
//                   )}

//                   <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px]">
//                     <span className="text-slate-500">
//                       Linked{" "}
//                       {account.connectedAt
//                         ? new Date(account.connectedAt).toLocaleDateString()
//                         : ""}
//                     </span>
//                     <div className="flex items-center gap-3">
//                       {account.profileUrl && (
//                         <a
//                           href={account.profileUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-cyan-400 hover:underline"
//                         >
//                           View profile
//                         </a>
//                       )}
//                       <button
//                         onClick={() => handleDisconnect(id)}
//                         disabled={isBusy}
//                         className="text-red-300 hover:underline disabled:opacity-50"
//                       >
//                         {isBusy ? "Working..." : "Disconnect"}
//                       </button>
//                     </div>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <p className="text-xs text-slate-400">{blurb}</p>
//                   <button
//                     onClick={() => handleConnect(id)}
//                     disabled={isBusy}
//                     className="w-full rounded-full border border-cyan-400/40 bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
//                   >
//                     {isBusy ? "Redirecting..." : `Connect ${label}`}
//                   </button>
//                   {!user && (
//                     <p className="text-[10px] text-slate-500">Sign in first to link accounts.</p>
//                   )}
//                 </>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }





































import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { api, apiConfig } from "../../services/api";
import { ConnectedAccounts } from "./ConnectedAccounts";

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

  // First linked account that has a photo (GitHub / LinkedIn) - used on the badge
  const linkedAvatar = (user?.socialAccounts || []).find((a) => a.avatarUrl)?.avatarUrl;

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

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
            Manage your account credentials, connected accounts, and calibrated topic targets.
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
            onClick={() => openAuth("login")}
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
                onClick={() => openAuth("register")}
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
                      {["Easy", "Mid", "Hard"][state.levels[topicName]] ??
                        `Level ${state.levels[topicName]}`}
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

      {/* Connected Accounts: GitHub & LinkedIn */}
      <ConnectedAccounts onRequireAuth={() => openAuth("login")} />

      {/* Backend API Connection Card */}
      {/* <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
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
      </div> */}

      {/* Social Badges & Sharing */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LinkedIn Share Badge */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white mb-4">
            LinkedIn Verified Badge
          </h2>
          <div className="rounded-xl bg-gradient-to-br from-[#031433] to-[#0a3a8a] p-5 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div className="text-[10px] font-mono tracking-widest text-cyan-300">
                CALIBR8 CERTIFIED
              </div>
              {linkedAvatar && (
                <img
                  src={linkedAvatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full border border-cyan-300/50 object-cover"
                />
              )}
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