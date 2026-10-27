"use client";

/**
 * Session provider.
 *
 * The server holds sessions; the browser only stores the opaque bearer token.
 * The token lives in `localStorage` (not a cookie) because the API is consumed
 * with an `Authorization` header, exactly like the mobile app. This provider is
 * the single writer of that token and keeps the shared API client in sync.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserClient, onUnauthorized } from "@/lib/api/client";
import { BazarApi } from "@/lib/api/bazar-api";
import type { ApiUser, AuthResult } from "@/lib/types";

const TOKEN_KEY = "bazar.auth.token";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionValue {
  status: SessionStatus;
  user: ApiUser | null;
  /** Adopt a session returned by login/register/quick-account. */
  adoptSession: (result: AuthResult) => void;
  /**
   * Frictionless guest ordering: create (or resume) an account from a phone
   * number alone, then adopt the session. Returns the created user.
   */
  quickAccount: (phone: string) => Promise<ApiUser>;
  /** Replace the cached user after a profile update. */
  setUser: (user: ApiUser) => void;
  /** Reload the user from the server. */
  refresh: () => Promise<void>;
  /** End the session. `everywhere` revokes every device's token. */
  logout: (everywhere?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable; the in-memory token still works for this tab */
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUserState] = useState<ApiUser | null>(null);
  const [api] = useState(() => {
    const client = getBrowserClient();
    client.setToken(readStoredToken());
    return new BazarApi(client);
  });

  const clearSession = useCallback(() => {
    getBrowserClient().setToken(null);
    writeStoredToken(null);
    setUserState(null);
    setStatus("anonymous");
  }, []);

  const adoptSession = useCallback((result: AuthResult) => {
    getBrowserClient().setToken(result.token);
    writeStoredToken(result.token);
    setUserState(result.user);
    setStatus("authenticated");
  }, []);

  const quickAccount = useCallback(
    async (phone: string) => {
      const result = await api.quickAccount({ phone });
      adoptSession(result);
      return result.user;
    },
    [api, adoptSession],
  );

  useEffect(() => {
    onUnauthorized(() => clearSession());
  }, [clearSession]);

  const refresh = useCallback(async () => {
    if (!getBrowserClient().hasToken()) {
      setStatus("anonymous");
      setUserState(null);
      return;
    }
    try {
      const current = await api.me();
      setUserState(current);
      setStatus("authenticated");
    } catch {
      clearSession();
    }
  }, [api, clearSession]);

  useEffect(() => {
    let cancelled = false;
    if (!getBrowserClient().hasToken()) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setUserState(null);
        setStatus("anonymous");
      });
      return () => {
        cancelled = true;
      };
    }
    api
      .me()
      .then((current) => {
        if (cancelled) return;
        setUserState(current);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [api, clearSession]);

  const logout = useCallback(
    async (everywhere = false) => {
      try {
        if (everywhere) await api.logoutEverywhere();
        else await api.logout();
      } catch {
        /* clearing the local session is what matters to the user */
      }
      clearSession();
    },
    [api, clearSession],
  );

  const value = useMemo<SessionValue>(
    () => ({ status, user, adoptSession, quickAccount, setUser: setUserState, refresh, logout }),
    [status, user, adoptSession, quickAccount, refresh, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within a SessionProvider");
  return value;
}
