import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function SocialConnect({ user }) {
  const [accounts, setAccounts] = useState(user?.socialAccounts || []);
  const githubConnected = accounts.find((a) => a.provider === "github");

  const connect = async (provider) => {
    try {
      const data = await api.social.getLinkUrl(provider);
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.warn("Could not start linking:", err.message);
    }
  };

  const disconnect = async (provider) => {
    try {
      await api.social.unlink(provider);
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
    } catch (err) {
      console.warn("Could not unlink:", err.message);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked") === "github") {
      window.history.replaceState({}, "", window.location.pathname);
      window.location.reload(); // reload to get updated user with socialAccounts
    }
  }, []);

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">Connected Accounts</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>GitHub</span>
          {githubConnected && <span className="text-xs text-green-600">@{githubConnected.username}</span>}
        </div>
        {githubConnected ? (
          <button onClick={() => disconnect("github")} className="text-sm px-3 py-1 bg-red-100 rounded">Disconnect</button>
        ) : (
          <button onClick={() => connect("github")} className="text-sm px-3 py-1 bg-black text-white rounded">Connect GitHub</button>
        )}
      </div>
    </div>
  );
}