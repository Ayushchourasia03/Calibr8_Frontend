import { useEffect, useState } from "react";
import { socialApi } from "./socialApi";
import { useCalibr8 } from "../../context/Calibr8Context";

const GithubIcon = () => (
  <svg viewBox="0 0 16 16" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const LinkedinIcon = () => (
  <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0a66c2] text-[11px] font-bold leading-none text-white">
    in
  </span>
);

const PROVIDERS = [
  {
    id: "github",
    label: "GitHub",
    Icon: GithubIcon,
    blurb: "Show your repos and followers on your profile.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    Icon: LinkedinIcon,
    blurb: "Verify your identity and use your photo on your badge.",
  },
];

function Avatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-blue-500/20 text-sm font-bold text-cyan-200">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Profile"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-14 w-14 rounded-full border border-cyan-400/40 object-cover"
    />
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-center">
      <div className="text-sm font-bold text-white">{value ?? 0}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

export function ConnectedAccounts({ onRequireAuth }) {
  const { user, refreshUser } = useCalibr8();
  const [busy, setBusy] = useState(null); // provider id currently working
  const [status, setStatus] = useState(() => {
    const linkError = new URLSearchParams(window.location.search).get(
      "link_error",
    );
    return linkError
      ? { type: "error", message: linkError }
      : { type: "", message: "" };
  });

  const accounts = user?.socialAccounts || [];
  const byProvider = Object.fromEntries(accounts.map((a) => [a.provider, a]));

  // Handle redirect back from OAuth: /?linked=github or /?link_error=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("link_error");
    if (!linked && !linkError) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (linkError) return;

    Promise.resolve(refreshUser?.())
      .then(() =>
        setStatus({
          type: "success",
          message: `${linked} connected successfully.`,
        }),
      )
      .catch(() =>
        setStatus({
          type: "error",
          message: "Linked, but failed to refresh your profile.",
        }),
      );
  }, [refreshUser]);

  const handleConnect = async (provider) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }

    setBusy(provider);
    setStatus({ type: "", message: "" });

    try {
      const { url } = await socialApi.getLinkUrl(provider);
      if (url) window.location.assign(url);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not start linking.",
      });
      setBusy(null);
    }
  };

  const handleDisconnect = async (provider) => {
    setBusy(provider);
    setStatus({ type: "", message: "" });

    try {
      await socialApi.unlink(provider);
      await refreshUser?.();
      setStatus({ type: "success", message: `${provider} disconnected.` });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to disconnect.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
      <div>
        <h2 className="text-sm font-semibold text-white">Connected Accounts</h2>
        <p className="text-xs text-slate-400">
          Link your developer and professional profiles to enrich your Calibr8
          identity.
        </p>
      </div>

      {status.message && (
        <div
          className={`rounded-lg p-2.5 text-xs ${
            status.type === "error"
              ? "border border-red-500/30 bg-red-950/40 text-red-300"
              : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map(({ id, label, Icon, blurb }) => {
          const account = byProvider[id];
          const isBusy = busy === id;

          return (
            <div
              key={id}
              className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Icon />
                  {label}
                </div>
                {account && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                    Connected
                  </span>
                )}
              </div>

              {account ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={account.avatarUrl}
                      name={account.name || account.username}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {account.name || account.username}
                      </div>
                      {account.username && (
                        <div className="truncate text-[11px] text-slate-400">
                          @{account.username}
                        </div>
                      )}
                      {account.email && (
                        <div className="truncate text-[11px] text-slate-500">
                          {account.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {(account.bio || account.headline) && (
                    <p className="line-clamp-2 text-xs text-slate-300">
                      {account.bio || account.headline}
                    </p>
                  )}

                  {id === "github" && account.stats && (
                    <div className="grid grid-cols-3 gap-2">
                      <Stat label="Repos" value={account.stats.publicRepos} />
                      <Stat label="Followers" value={account.stats.followers} />
                      <Stat label="Following" value={account.stats.following} />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px]">
                    <span className="text-slate-500">
                      {account.connectedAt
                        ? `Linked ${new Date(account.connectedAt).toLocaleDateString()}`
                        : "Linked"}
                    </span>
                    <div className="flex items-center gap-3">
                      {account.profileUrl && (
                        <a
                          href={account.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          View profile
                        </a>
                      )}
                      <button
                        onClick={() => handleDisconnect(id)}
                        disabled={isBusy}
                        className="text-red-300 hover:underline disabled:opacity-50"
                      >
                        {isBusy ? "Working..." : "Disconnect"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">{blurb}</p>
                  <button
                    onClick={() => handleConnect(id)}
                    disabled={isBusy}
                    className="w-full rounded-full border border-cyan-400/40 bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
                  >
                    {isBusy ? "Redirecting..." : `Connect ${label}`}
                  </button>
                  {!user && (
                    <p className="text-[10px] text-slate-500">
                      Sign in first to link accounts.
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
