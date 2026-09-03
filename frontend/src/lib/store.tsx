"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

type Theme = "dark" | "light";
type View = "dashboard" | "history" | "howItWorks" | "settings";
type Lang = "en" | "ar";
type Identity = "cyber" | "quantum" | "sentinel" | "research";

export type ConnectionStatus = 'checking' | 'connected' | 'failed' | 'missing_env' | 'missing_bucket' | 'permission_denied';

interface GlobalState {
  connectionStatus: ConnectionStatus;
  connectionError?: string;
  storageStatus: ConnectionStatus;
  storageError?: string;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  identity: Identity;
  setIdentity: (i: Identity) => void;
  activeView: View;
  setActiveView: (v: View) => void;
  systemName: string;
  setSystemName: (s: string) => void;
  isAdmin: boolean;
  setIsAdmin: (a: boolean) => void;
  logo: string | null;
  setLogo: (l: string | null) => void;
}

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const [identity, setIdentity] = useState<Identity>("cyber");
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [systemName, setSystemName] = useState("PhishGuard AI");
  const [isAdmin, setIsAdmin] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [connectionError, setConnectionError] = useState<string>();
  const [storageStatus, setStorageStatus] = useState<ConnectionStatus>('checking');
  const [storageError, setStorageError] = useState<string>();

  useEffect(() => {
    if (!supabase) {
      setConnectionStatus('missing_env');
      setStorageStatus('missing_env');
      return;
    }

    setConnectionStatus('checking');
    setStorageStatus('checking');

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    
    // Fetch branding settings to test DATABASE connection
    supabase.from('app_settings').select('*').eq('id', 1).single().then(({ data, error }) => {
      if (error) {
        setConnectionStatus('failed');
        setConnectionError(error.message);
      } else if (data) {
        setConnectionStatus('connected');
        if (data.brand_name) setSystemName(data.brand_name);
        if (data.theme_identity) setIdentity(data.theme_identity as Identity);
        if (data.logo_url) setLogo(data.logo_url);
      }
    });

    // Test STORAGE connection using a safe list operation against brand_assets
    supabase.storage.from('brand_assets').list(undefined, { limit: 1 }).then(({ error }) => {
      if (error) {
        if (error.message.includes('not found') || error.message.includes('Bucket not found') || error.name === 'StorageNotFoundError') {
          setStorageStatus('missing_bucket');
          setStorageError('Bucket "brand_assets" is missing');
        } else if (error.message.includes('row-level security') || error.message.includes('permission')) {
          setStorageStatus('permission_denied');
          setStorageError('Permission denied (RLS)');
        } else {
          setStorageStatus('failed');
          setStorageError(error.message);
        }
      } else {
        setStorageStatus('connected');
      }
    });return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-identity", identity);
    document.documentElement.setAttribute("lang", lang);
    
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    if (lang === "ar") document.documentElement.classList.add("lang-ar");
    else document.documentElement.classList.remove("lang-ar");
  }, [theme, lang, identity]);

  return (
    <GlobalContext.Provider value={{
      lang, setLang, theme, setTheme, identity, setIdentity,
      activeView, setActiveView, systemName, setSystemName,
      isAdmin, setIsAdmin, logo, setLogo,
      
      connectionStatus, connectionError,
      storageStatus, storageError
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}

