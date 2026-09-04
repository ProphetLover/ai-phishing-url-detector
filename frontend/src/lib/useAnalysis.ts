import { useState } from 'react';
import { supabase } from './supabase';


export interface AnalysisResult {
  url_hash: string;
  sanitized_display_url: string;
  prediction: string;
  estimated_risk_score: number;
  model_confidence: number;
  model_version: string;
  raw_features: Record<string, number | boolean>;
}

export function useAnalysis() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [scanStep, setScanStep] = useState(-1);

  const hashString = async (str: string) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const analyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) {
      setError("errEmpty");
      return;
    }
    if (url.length > 2000) {
      setError("errTooLong");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("errInvalid");
      return;
    }
    
    setError("");
    setIsAnalyzing(true);
    setResult(null);
    setScanStep(1); // URL Received

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.endsWith('/api/analyze') ? baseUrl : (baseUrl.endsWith('/') ? baseUrl + 'api/analyze' : baseUrl + '/api/analyze');
      
      // Simulate step progress for visual effect
      setTimeout(() => setScanStep(2), 400); // Feature Extraction
      setTimeout(() => setScanStep(3), 800); // AI/ML Analysis
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      
      setScanStep(4); // Risk Evaluation

      const data = await res.json();
      
      if (!res.ok) {
         // Pass the error message directly to be handled, or use a generic network error
         throw new Error(data.detail || "API Error");
      }
      
      setResult(data);
      setScanStep(5); // Complete

      if (supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id || null;
          
          const { error: insertError } = await supabase.from("url_analyses").insert([{
            user_id: userId,
            url_hash: await hashString(url),
            sanitized_display_url: url.length > 255 ? url.substring(0, 252) + "..." : url,
            prediction: data.prediction,
            risk_score: data.estimated_risk_score,
            confidence: data.model_confidence,
            model_version: data.model_version,
            features_json: data.raw_features
          }]);
          
          if (insertError) {
            console.error("Supabase insert error:", insertError.message);
          }
        } catch (supabaseError) {
          console.error("Supabase storage failed:", supabaseError);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message === "API Error" || err.message ? "errApi" : "errNetwork");
      } else {
        setError("errNetwork");
      }
      setScanStep(-1);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        if (scanStep !== -1) setScanStep(5);
      }, 500);
    }
  };

  return { url, setUrl, isAnalyzing, result, setResult, analyze, error, setError, scanStep, setScanStep };
}

