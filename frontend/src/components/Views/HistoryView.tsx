"use client";
import React, { useEffect, useState } from "react";
import { useGlobal } from "@/lib/store";
import { getTr, T } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "@/lib/useAnalysis";
import { ShieldCheck, ShieldAlert, AlertTriangle, Link, Search, ArrowLeft, ArrowRight } from "lucide-react";

interface HistoryItem extends AnalysisResult {
  id: string;
  created_at: string;
  risk_score: number;
  confidence: number;
}

export function HistoryView() {
  const { lang, setActiveView } = useGlobal();
  const tr = (key: keyof typeof T.en) => getTr(lang, key);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

    const [errorState, setErrorState] = useState<"none" | "no_supabase" | "auth_error" | "db_error">("none");

    useEffect(() => {
      async function load() {
        try {
          if (!supabase) {
            setErrorState("no_supabase");
            setLoading(false);
            return;
          }

          // History is public! We fetch from the secure View.
          const { data, error } = await supabase
            .from('recent_public_history')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            if (error.message === 'Failed to fetch') {
              console.error("Supabase Connection Error: Failed to fetch. This usually means your Supabase project is paused or the URL is incorrect. Please check your Supabase dashboard and reactivate the project if necessary.");
            } else {
              console.error("Supabase error:", error);
            }
            setErrorState("db_error");
          } else if (data) {
            setHistory(data);
          }
        } catch (e) {
          console.error(e);
          setErrorState("db_error");
        }
        setLoading(false);
      }
      load();
    }, []);

  const getStatusIcon = (prediction: string) => {
    const p = (prediction || "").toLowerCase();
    if (p === 'phishing') return <ShieldAlert size={16} className="text-danger" />;
    return <ShieldCheck size={16} className="text-safe" />;
  };

  const getStatusColor = (prediction: string) => {
    const p = (prediction || "").toLowerCase();
    if (p === 'phishing') return "bg-danger-bg text-danger";
    return "bg-safe-bg text-safe";
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 w-full rounded-xl bg-[linear-gradient(90deg,var(--surface-elevated)_25%,var(--border)_37%,var(--surface-elevated)_63%)] bg-[length:400%_100%] animate-[shimmer_1.4s_ease_infinite]" />
        ))}
      </div>
    );
  }

  if (selectedId) {
    const item = history.find(h => h.id === selectedId);
    if (!item) return null;
    const isPhishing = (item.prediction || "").toLowerCase() === 'phishing';
    
    return (
      <div className="flex flex-col gap-6 animate-page-fade">
        <button onClick={() => setSelectedId(null)} className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors text-[13.5px] font-semibold -ms-3">
          {lang === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {tr("backToHistory")}
        </button>
        
        <h2 className="text-xl font-bold flex items-center gap-2">
          {getStatusIcon(item.prediction)}
          {tr("detailsTitle")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`col-span-1 p-6 rounded-2xl flex flex-col gap-4 border ${isPhishing ? 'bg-[linear-gradient(160deg,var(--danger-bg),transparent_70%)] border-danger/30' : 'bg-[linear-gradient(160deg,var(--safe-bg),transparent_70%)] border-safe/30'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPhishing ? 'bg-danger/20 text-danger' : 'bg-safe/20 text-safe'}`}>
              {isPhishing ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{tr("colPrediction")}</div>
              <div className={`text-3xl font-bold ${isPhishing ? 'text-danger' : 'text-safe'}`}>
                {isPhishing ? tr("predPhishing") : tr("predLegit")}
              </div>
            </div>
          </div>
          
          <div className="col-span-1 p-6 rounded-2xl glass-panel flex flex-col justify-center gap-6">
            <div>
              <div className="text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{tr("riskScore")}</div>
              <div className="text-3xl font-bold mt-2">{Number(item.risk_score).toFixed(1)} <span className="text-[14px] text-text-muted font-normal">/ 100</span></div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{tr("modelConfidence")}</div>
              <div className="text-3xl font-bold mt-2">{(item.confidence * (item.confidence <= 1 ? 100 : 1)).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="flex items-start gap-3 min-w-0">
            <Link size={16} className="text-text-muted shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[11px] text-text-muted mb-1">{tr("analyzedUrl")}</div>
              <div className="font-semibold break-all text-text-primary">{item.sanitized_display_url || item.url_hash}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] text-text-muted mb-1">{tr("modelVersion")}</div>
              <div className="font-semibold">{item.model_version || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorState !== "none") {
    const errIcon = <AlertTriangle size={28} />;
    let errTitle = "";
    let errBody = "";

    if (errorState === "auth_error") {
      errTitle = tr("historyErrAuthTitle");
      errBody = tr("historyErrAuthBody");
    } else if (errorState === "db_error") {
      errTitle = tr("historyErrDbTitle");
      errBody = tr("historyErrDbBody");
    } else if (errorState === "no_supabase") {
      errTitle = tr("historyErrEnvTitle");
      errBody = tr("historyErrEnvBody");
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted mb-4">
          {errIcon}
        </div>
        <h3 className="text-[16px] font-bold mb-2 text-danger">{errTitle}</h3>
        <p className="text-[13px] text-text-muted max-w-sm mb-6">{errBody}</p>
        <button onClick={() => setActiveView("dashboard")} className="px-6 py-2.5 rounded-lg border border-border text-[13.5px] font-bold hover:bg-surface-elevated">
          {tr("backToDashboard")}
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted mb-4">
          <Search size={28} />
        </div>
        <h3 className="text-[16px] font-bold mb-2">{tr("emptyHistoryTitle")}</h3>
        <p className="text-[13px] text-text-muted max-w-sm mb-6">{tr("emptyHistoryBody")}</p>
        <button onClick={() => setActiveView("dashboard")} className="btn-primary px-6 py-2.5 rounded-lg text-[13.5px] font-bold">
          {tr("goToScan")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{tr("historyTitle")}</h1>
        <p className="text-text-muted text-[13.5px]">{tr("historySub")}</p>
      </div>

      <div className="hidden md:block overflow-x-auto glass-panel">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-text-muted font-bold">{tr("colUrl")}</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-text-muted font-bold">{tr("colPrediction")}</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-text-muted font-bold">{tr("colRisk")}</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-text-muted font-bold">{tr("colDate")}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} onClick={() => setSelectedId(item.id)} className="border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors group">
                <td className="px-6 py-4 max-w-[300px]">
                  <div className="font-semibold truncate group-hover:text-accent-1 transition-colors">{item.sanitized_display_url || item.url_hash}</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(item.prediction)}`}>
                    {getStatusIcon(item.prediction)}
                    {(item.prediction || "").toLowerCase() === 'phishing' ? tr("predPhishing") : tr("predLegit")}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-semibold">{Number(item.risk_score).toFixed(1)}</td>
                <td className="px-6 py-4 text-text-muted text-[12px]">{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {history.map(item => (
          <div key={item.id} onClick={() => setSelectedId(item.id)} className="glass-panel p-4 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="font-semibold text-[13px] truncate">{item.sanitized_display_url || item.url_hash}</div>
              <div className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(item.prediction)}`}>
                {getStatusIcon(item.prediction)}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11.5px] text-text-muted">
              <span>{tr("riskScore")}: <b className="text-text-primary">{Number(item.risk_score).toFixed(1)}</b></span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
