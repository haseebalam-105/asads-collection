"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import en, { Dictionary } from "@/lib/i18n/en";
import ur from "@/lib/i18n/ur";
import { Locale } from "@/types/product";

interface LanguageContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const dictionaries: Record<Locale, Dictionary> = { en, ur };

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("asad-locale") as Locale | null;
    if (stored === "en" || stored === "ur") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("asad-locale", next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: locale === "ur" ? "rtl" : "ltr",
      t: dictionaries[locale],
      setLocale,
    }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
