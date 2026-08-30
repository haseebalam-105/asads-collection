"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { siteSettings as defaultSettings } from "@/lib/settings";

export type SiteSettings = typeof defaultSettings;

const SettingsContext = createContext<SiteSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.error) return;
        // Merge over the defaults so any field the admin hasn't set yet
        // still falls back gracefully instead of showing blank.
        setSettings((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {
        // Network/DB issue — keep showing the built-in defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => settings, [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
