"use client";
import React, { useState } from "react";
import { useGlobal } from "@/lib/store";
import { getTr, T } from "@/lib/i18n";
import { ShieldCheck, Palette, Edit3, Settings, Upload, Globe, Lock, LogIn, Mail, LogOut } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

export function SettingsView() {
  const [isSaving, setIsSaving] = useState(false);
  const { 
    lang, setLang, 
    theme, setTheme,
    identity, setIdentity,
    systemName, setSystemName,
    logo, setLogo,
    isAdmin,
} = useGlobal();
  const tr = (key: keyof typeof T.en) => getTr(lang, key);
  const { showToast } = useToast();

  const [authModal, setAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  let initEn = systemName;
  let initAr = systemName;
  try {
    const parsed = JSON.parse(systemName);
    if (parsed && typeof parsed === 'object') {
      initEn = parsed.en || initEn;
      initAr = parsed.ar || initEn;
    }
  } catch {}

  const [editNameEn, setEditNameEn] = useState(initEn);
  const [editNameAr, setEditNameAr] = useState(initAr);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState(logo);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showToast(tr("adminErrEmpty"), "error");
    if (!supabase) return showToast("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and ANON_KEY", "error");

    setIsAuthenticating(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    
    if (error) {
      showToast(error.message, "error");
    } else {
      setAuthModal(false);
      setEmail("");
      setPassword("");
    }
    setIsAuthenticating(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return showToast('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and ANON_KEY', 'error');
    if (!newPassword || newPassword.length < 6) return showToast('Password must be at least 6 characters.', 'error');
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password updated successfully.', 'success');
      setNewPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    
    if (!supabase) {
      showToast("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and ANON_KEY", "error");
      setIsSaving(false);
      return;
    }

    try {
      let finalLogoUrl = logo;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('brand_assets')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(fileName);
        finalLogoUrl = publicUrl;
      }

      const serializedName = JSON.stringify({ en: editNameEn, ar: editNameAr });

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ 
          brand_name: serializedName,
          theme_identity: identity,
          logo_url: finalLogoUrl
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      setSystemName(serializedName);
      if (finalLogoUrl) setLogo(finalLogoUrl);
      
      showToast(tr("savedToast"), "success");
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : tr("saveErrToast"), "error");
    }
    
    setIsSaving(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in relative z-10 pb-24 md:pb-0 px-4 md:px-0">
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] md:text-[32px] font-bold text-text-primary flex items-center gap-3 font-display">
          <Settings className="text-accent-1" size={28} />
          {tr("settingsTitle")}
        </h2>
        <p className="text-[14px] text-text-muted">{tr("settingsSub")}</p>
      </div>

      <div className="glass-panel p-6 md:p-8 flex flex-col gap-8 rounded-[24px]">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 flex-row-dynamic">
          <div className="flex items-center gap-4 flex-row-dynamic">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-strong flex items-center justify-center shrink-0">
              <Globe className="text-accent-1" size={20} />
            </div>
            <div className="text-align-dynamic">
              <h3 className="text-[15px] font-bold text-text-primary">{tr("langRowTitle")}</h3>
              <p className="text-[13px] text-text-muted mt-0.5">{tr("langRowSub")}</p>
            </div>
          </div>
          <SegmentedControl 
            options={[
              { id: 'en', label: tr('langEn') },
              { id: 'ar', label: tr('langAr') }
            ]}
            activeId={lang}
            onChange={(id) => setLang(id as Parameters<typeof setLang>[0])} 
            className="w-full md:w-auto"
          />
        </div>

        <div className="h-[1px] w-full bg-border-strong" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 flex-row-dynamic">
          <div className="flex items-center gap-4 flex-row-dynamic">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-strong flex items-center justify-center shrink-0">
              <Palette className="text-accent-1" size={20} />
            </div>
            <div className="text-align-dynamic">
              <h3 className="text-[15px] font-bold text-text-primary">{tr("themeRowTitle")}</h3>
              <p className="text-[13px] text-text-muted mt-0.5">{tr("themeRowSub")}</p>
            </div>
          </div>
          <SegmentedControl 
            options={[
              { id: 'dark', label: tr("dark") },
              { id: 'light', label: tr("light") }
            ]}
            activeId={theme}
            onChange={(id) => setTheme(id as Parameters<typeof setTheme>[0])} 
            className="w-full md:w-auto"
          />
        </div>

        <div className="h-[1px] w-full bg-border-strong" />

        <div className="flex flex-col gap-4 text-align-dynamic">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-dynamic">
             <div className="text-align-dynamic">
               <h3 className="text-[15px] font-bold text-text-primary">{tr("identityTitle")}</h3>
               <p className="text-[13px] text-text-muted mt-0.5">{tr("identitySub")}</p>
             </div>
             {isAdmin && (
               <div className="text-[11px] font-bold px-3 py-1 bg-accent-1/10 text-accent-1 rounded-full border border-accent-1/20 w-fit">
                  {tr("loggedInAs")} Admin
               </div>
             )}
          </div>
          
          <SegmentedControl 
            options={[
              { id: 'cyber', label: 'Cyber' },
              { id: 'quantum', label: 'Quantum' },
              { id: 'sentinel', label: 'Sentinel' },
              { id: 'research', label: 'Research' }
            ]}
            activeId={identity}
            onChange={async (id) => {
              const newIdentity = id as Parameters<typeof setIdentity>[0];
              setIdentity(newIdentity);
              if (isAdmin && supabase) {
                await supabase.from('app_settings').update({ theme_identity: newIdentity }).eq('id', 1);
              }
            }} 
            className="w-full"
          />
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8 flex flex-col items-center justify-center rounded-[24px] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-1/50 to-transparent opacity-50" />
        
        {!isAdmin ? (
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted mb-2">
                <Lock size={28} />
             </div>
             <div>
               <h3 className="text-[16px] font-bold text-text-primary">Admin Access Required</h3>
               <p className="text-[13px] text-text-muted max-w-sm mt-2">Log in to change the system logo and name.</p>
             </div>
             <button onClick={() => setAuthModal(true)} className="btn-primary px-8 py-3 rounded-xl text-[14px] font-bold mt-2 shadow-lg">
               {tr("adminLinkText")}
             </button>
             <p className="text-[11px] text-text-muted mt-2 font-mono">Use Supabase Auth</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6 text-align-dynamic">
            <div className="flex items-center justify-between flex-row-dynamic">
              <div>
                <h3 className="font-bold text-[18px] text-text-primary font-display">{tr("adminPanelTitle")}</h3>
                <p className="text-[13.5px] text-text-muted mt-1">{tr("adminPanelSub")}</p>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border-strong text-[13px] font-bold text-text-secondary hover:text-danger hover:border-danger/40 transition-all flex-row-dynamic">
                <LogOut size={16} />
                {tr("logOut")}
              </button>
            </div>

            <div className="glass-panel p-8 flex flex-col gap-8 rounded-[24px]">
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 flex-row-dynamic">
                <div className="w-32 h-32 rounded-3xl bg-[linear-gradient(135deg,var(--surface-elevated),var(--surface))] border-2 border-border-strong flex items-center justify-center shrink-0 overflow-hidden shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] relative group">
                  {logoPreview ? (
                     <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                     <ShieldCheck size={48} className="text-text-muted" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Upload size={24} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                
                <div className="flex flex-col gap-3 flex-1 w-full text-align-dynamic">
                  <label className="text-[14px] font-bold text-text-secondary">{tr("logoLabel")}</label>
                  <p className="text-[12.5px] text-text-muted mb-2">Upload a transparent PNG for best results. Aspect ratio will be preserved.</p>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border-strong text-[13.5px] font-bold hover:border-accent-1 hover:text-accent-1 transition-colors self-start flex-row-dynamic">
                    <Upload size={16} />
                    {tr("changeLogoBtn")}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="h-[1px] w-full bg-border-strong" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[13.5px] font-bold text-text-secondary">{tr("systemNameEnLabel")}</label>
                  <div className="relative">
                    <Edit3 size={18} className={`absolute top-1/2 -translate-y-1/2 text-text-muted left-4`} />
                    <input 
                      type="text" 
                      value={editNameEn}
                      onChange={(e) => setEditNameEn(e.target.value)}
                      className="w-full bg-surface border-2 border-border-strong rounded-xl py-3.5 text-[15px] text-text-primary outline-none focus:border-accent-1 transition-colors text-align-dynamic ps-12 pe-4"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[13.5px] font-bold text-text-secondary">{tr("systemNameArLabel")}</label>
                  <div className="relative">
                    <Edit3 size={18} className={`absolute top-1/2 -translate-y-1/2 text-text-muted left-4`} />
                    <input 
                      type="text" 
                      value={editNameAr}
                      onChange={(e) => setEditNameAr(e.target.value)}
                      dir="rtl"
                      className="w-full bg-surface border-2 border-border-strong rounded-xl py-3.5 text-[15px] text-text-primary outline-none focus:border-accent-1 transition-colors text-align-dynamic ps-12 pe-4"
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-border-strong" />
              <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-3" autoComplete="off">
                <label className="text-[13.5px] font-bold text-text-secondary">Update Admin Password</label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Lock size={18} className="absolute top-1/2 -translate-y-1/2 text-text-muted left-4" />
                    <input 
                      type="password" 
                      name="new_admin_password_bypass"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full bg-surface border-2 border-border-strong rounded-xl py-3.5 text-[15px] text-text-primary outline-none focus:border-accent-1 transition-colors text-align-dynamic ps-12 pe-4"
                    />
                  </div>
                  <button type="submit" disabled={isUpdatingPassword || !newPassword} className="px-6 rounded-xl bg-surface-elevated border border-border-strong font-bold text-sm hover:border-accent-1 hover:text-accent-1 disabled:opacity-50 transition-colors">
                    {isUpdatingPassword ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>

              <button onClick={handleSaveBranding} disabled={isSaving} className="btn-primary py-4 rounded-xl w-full text-[15px] font-bold mt-4 shadow-lg disabled:opacity-50">
                {isSaving ? tr("savingBtn") : tr("saveBtn")}
              </button>
            </div>
          </div>
        )}
      </div>

      {authModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim backdrop-blur-md animate-page-fade">
          <div className="w-full max-w-md bg-surface-glass border border-border-strong rounded-[28px] p-8 shadow-[var(--shadow-elev)] text-align-dynamic">
            <h3 className="text-[20px] font-bold mb-3 flex items-center gap-3 font-display flex-row-dynamic">
              <div className="p-2 rounded-lg bg-accent-1/20 text-accent-1"><LogIn size={20} /></div>
              {tr("adminModalTitle")}
            </h3>
            <p className="text-[14px] text-text-muted mb-8 leading-relaxed">
              {tr("adminModalSub")}
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5" autoComplete="off">
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-bold text-text-secondary">Admin Email</label>
                <div className="relative">
                  <Mail size={18} className={`absolute top-1/2 -translate-y-1/2 text-text-muted left-4`} />
                  <input
                    type="email"
                    name="admin_email_bypass"
                    autoComplete="new-password"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-surface-elevated border-2 border-border-strong rounded-xl py-3.5 text-[15px] text-text-primary outline-none focus:border-accent-1 transition-colors text-align-dynamic ps-12 pe-4"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-bold text-text-secondary">{tr("adminPassLabel")}</label>
                <div className="relative">
                  <Lock size={18} className={`absolute top-1/2 -translate-y-1/2 text-text-muted left-4`} />
                  <input
                    type="password"
                    name="admin_password_bypass"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr("adminPassPlaceholder")}
                    className="w-full bg-surface-elevated border-2 border-border-strong rounded-xl py-3.5 text-[15px] text-text-primary outline-none focus:border-accent-1 transition-colors text-align-dynamic ps-12 pe-4"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 flex-row-dynamic">
                <button type="button" onClick={() => setAuthModal(false)} className="flex-1 py-3.5 rounded-xl bg-surface border border-border-strong text-[14px] font-bold text-text-secondary hover:text-text-primary transition-colors">
                  {tr("cancel")}
                </button>
                <button type="submit" disabled={isAuthenticating} className="flex-1 py-3.5 rounded-xl btn-primary text-[14px] font-bold disabled:opacity-50 shadow-lg">
                  {isAuthenticating ? tr("signingIn") : tr("signIn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


