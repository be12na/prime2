
import React, { useState, useEffect } from 'react';
import { BRAND_ROLES, GEMINI_API_MODEL_PRESETS } from '../../constants.ts';
import { GoogleGenAI } from "@google/genai";

type BrandRole = 'produk' | 'kreator' | 'afiliasi';
const CUSTOM_API_MODEL_VALUE = '__custom_model__';

const GuideStudio: React.FC = () => {
    const [activeRole, setActiveRole] = useState<BrandRole>('produk');
    const [apiKey, setApiKey] = useState('');
    const [apiModelSelection, setApiModelSelection] = useState<string>(GEMINI_API_MODEL_PRESETS[0].value);
    const [customApiModel, setCustomApiModel] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' }>({ message: '', type: 'info' });
    const [quotaCheckStatus, setQuotaCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'warning'>('idle');

    const [brandProfile, setBrandProfile] = useState({
        produk: { style: '', audience: '', usp: '' },
        kreator: { persona: '', audience: '', usp: '' },
        afiliasi: { persona: '', audience: '', usp: '' },
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        const savedProfile = localStorage.getItem('brandProfile');
        const savedRole = localStorage.getItem('brandRole');
        const savedApiKey = sessionStorage.getItem('geminiApiKey');
        const savedApiModel = (sessionStorage.getItem('geminiApiModel') || '').trim();

        if (savedProfile) {
            try {
                setBrandProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error('Failed to parse saved brand profile', e);
                localStorage.removeItem('brandProfile');
            }
        }
        if (savedRole) {
            setActiveRole(savedRole as BrandRole);
        }
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
        if (savedApiModel) {
            const existsInPreset = GEMINI_API_MODEL_PRESETS.some((item) => item.value === savedApiModel);
            if (existsInPreset) {
                setApiModelSelection(savedApiModel);
                setCustomApiModel('');
            } else {
                setApiModelSelection(CUSTOM_API_MODEL_VALUE);
                setCustomApiModel(savedApiModel);
            }
        }
    }, []);

    const selectedApiModel = (apiModelSelection === CUSTOM_API_MODEL_VALUE ? customApiModel : apiModelSelection).trim();

    const handleSaveApiKey = () => {
        const trimmedApiKey = apiKey.trim();
        const trimmedModel = selectedApiModel;

        if (trimmedApiKey) {
            sessionStorage.setItem('geminiApiKey', trimmedApiKey);
            if (trimmedModel) {
                sessionStorage.setItem('geminiApiModel', trimmedModel);
            } else {
                sessionStorage.removeItem('geminiApiModel');
            }
            setApiKeyStatus({ message: 'Kunci API berhasil disimpan untuk sesi ini!', type: 'success' });
            // Auto-trigger validation logic after save
            validateApiKey(trimmedApiKey, trimmedModel || undefined);
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setApiKeyStatus({ message: 'Kunci API yang tersimpan telah dihapus.', type: 'info' });
            setQuotaCheckStatus('idle');
        }
        setTimeout(() => {
            if (apiKeyStatus.type === 'success') {
                setApiKeyStatus(prev => ({ ...prev, message: '' })); 
            }
        }, 4000);
    };

    const validateApiKey = async (key: string, model?: string) => {
        setQuotaCheckStatus('checking');
        setApiKeyStatus({ message: 'Memvalidasi kunci API dan jenis quota...', type: 'info' });
        
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            
            const modelName = model || 'gemini-2.5-flash';
            
            await ai.models.generateContent({
                model: modelName,
                contents: 'Test'
            });

            // If success, we assume at least it works. 
            // We can't strictly detect "Free vs Paid" via simple API call without hitting limits or metadata.
            // So we rely on the manual check for the visual part, but the API check confirms it's active.
            setQuotaCheckStatus('valid');
            setApiKeyStatus({ message: `API Valid! Terhubung ke model ${modelName}.`, type: 'success' });

        } catch (error: any) {
            console.error("API Validation failed", error);
            setQuotaCheckStatus('invalid');
            
            let errorMessage = error.message || 'Terjadi kesalahan';
            
            if (errorMessage.includes('429')) {
                setApiKeyStatus({ message: 'Validasi Gagal: Quota Terlampaui (429). Cek limit Free Tier Anda.', type: 'error' });
            } else if (errorMessage.includes('403') || errorMessage.includes('API key not valid')) {
                setApiKeyStatus({ message: 'Validasi Gagal: Kunci API tidak valid.', type: 'error' });
            } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                 // Fallback check if 1.5-flash is not found (rare but possible)
                 try {
                    const ai = new GoogleGenAI({ apiKey: key });
                    await ai.models.generateContent({
                        model: 'gemini-pro', // Fallback to legacy stable
                        contents: 'Test'
                    });
                    setQuotaCheckStatus('valid');
                    setApiKeyStatus({ message: 'API Valid! (Fallback ke gemini-pro)', type: 'success' });
                    return;
                 } catch (fallbackError) {
                    setApiKeyStatus({ message: `Validasi Gagal: Model tidak ditemukan (404). Pastikan API Key memiliki akses ke Gemini API.`, type: 'error' });
                 }
            } else {
                setApiKeyStatus({ message: `Validasi Gagal: ${errorMessage}`, type: 'error' });
            }
        }
    };

    const handleSave = () => {
        localStorage.setItem('brandProfile', JSON.stringify(brandProfile));
        localStorage.setItem('brandRole', activeRole);
        setStatus('Profil berhasil disimpan!');
        setTimeout(() => setStatus(''), 3000);
    };

    const handleProfileChange = (role: BrandRole, field: string, value: string) => {
        setBrandProfile(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [field]: value
            }
        }));
    };

    return (
        <div id="guide-studio" className="space-y-8">
            <div className="text-center px-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Panduan & Pengaturan</h2>
                <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto">Selamat datang di PRIME! Atur identitas Anda, kelola kunci API, dan pahami penggunaan Quota.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Kolom Kiri: Pengaturan API */}
                <div className="space-y-8">
                    {/* 1. Input API Key */}
                    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 md:p-8 space-y-4 shadow-2xl shadow-black/30">
                        <h3 className="text-xl font-semibold text-orange-400 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Pengaturan Kunci API
                        </h3>
                        <div className="space-y-2 pt-2">
                            <p className="text-sm text-slate-400 mb-4">
                                Masukkan Kunci API Google AI Studio Anda. Kunci disimpan aman di sesi browser.
                            </p>
                            <div className="space-y-3 mb-4">
                                <label htmlFor="api-model-select" className="block text-sm font-medium text-slate-300">Model API Gemini (Default Global)</label>
                                <select
                                    id="api-model-select"
                                    value={apiModelSelection}
                                    onChange={(e) => setApiModelSelection(e.target.value)}
                                    className="block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2.5 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                                >
                                    {GEMINI_API_MODEL_PRESETS.map((model) => (
                                        <option key={model.value} value={model.value}>{model.label}</option>
                                    ))}
                                    <option value={CUSTOM_API_MODEL_VALUE}>Custom model ID</option>
                                </select>
                                {apiModelSelection === CUSTOM_API_MODEL_VALUE && (
                                    <input
                                        type="text"
                                        value={customApiModel}
                                        onChange={(e) => setCustomApiModel(e.target.value)}
                                        className="block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2.5 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                                        placeholder="Contoh: gemini-3.1-flash-image-preview"
                                    />
                                )}
                                <p className="text-xs text-slate-500">Pilih preset model Gemini terbaru agar tidak perlu isi manual.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="flex-grow block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2.5 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                                    placeholder="Masukkan Kunci API Gemini Anda"
                                />
                                <button
                                    onClick={handleSaveApiKey}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
                                >
                                    {quotaCheckStatus === 'checking' ? 'Memvalidasi...' : 'Simpan & Validasi'}
                                </button>
                            </div>
                            {apiKeyStatus.message && (
                                <div className={`flex items-center gap-2 p-3 mt-2 text-sm rounded-lg border ${
                                    apiKeyStatus.type === 'success' ? 'text-green-300 bg-green-500/10 border-green-500/20' :
                                    apiKeyStatus.type === 'error' ? 'text-red-300 bg-red-500/10 border-red-500/20' :
                                    'text-sky-300 bg-sky-500/10 border-sky-500/20'
                                }`}>
                                    <span className="font-medium">{apiKeyStatus.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Kolom Kanan: Pusat Identitas */}
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 md:p-8 space-y-4 shadow-2xl shadow-black/30 h-fit">
                    <h3 className="text-xl font-semibold text-orange-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pusat Identitas Cerdas
                    </h3>
                    <p className="text-sm text-slate-400">
                        Definisikan identitas brand atau persona Anda di sini. AI akan menggunakan informasi ini untuk menyesuaikan setiap konten yang dibuat.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 bg-slate-700/50 rounded-lg p-1 mt-4">
                        {BRAND_ROLES.map(role => (
                            <button key={role.id} onClick={() => setActiveRole(role.id as BrandRole)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex-grow sm:flex-grow-0 ${activeRole === role.id ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                {role.label}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Forms */}
                    <div className="pt-4 border-t border-slate-700">
                        {/* Product Profile */}
                        <div className={`space-y-4 ${activeRole === 'produk' ? '' : 'hidden'}`}>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Gaya & Tone Brand</label>
                                <textarea value={brandProfile.produk.style} onChange={(e) => handleProfileChange('produk', 'style', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Elegan, Minimalis, Ramah, Profesional..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Target Audiens</label>
                                <textarea value={brandProfile.produk.audience} onChange={(e) => handleProfileChange('produk', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Wanita usia 20-35, pecinta skincare, tinggal di perkotaan..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Unique Selling Proposition (USP)</label>
                                <textarea value={brandProfile.produk.usp} onChange={(e) => handleProfileChange('produk', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Menggunakan bahan alami 100%, kemasan ramah lingkungan..."></textarea>
                             </div>
                        </div>
                        {/* Creator Profile */}
                        <div className={`space-y-4 ${activeRole === 'kreator' ? '' : 'hidden'}`}>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Persona Kreator</label>
                                <textarea value={brandProfile.kreator.persona} onChange={(e) => handleProfileChange('kreator', 'persona', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Enerjik, Humoris, Suka Tech Review..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Niche & Komunitas</label>
                                <textarea value={brandProfile.kreator.audience} onChange={(e) => handleProfileChange('kreator', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Gadget Enthusiast, Gamers, Mahasiswa IT..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Ciri Khas (USP)</label>
                                <textarea value={brandProfile.kreator.usp} onChange={(e) => handleProfileChange('kreator', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Review jujur tanpa endorse, editing cepat dan catchy..."></textarea>
                             </div>
                        </div>
                        {/* Affiliate Profile */}
                        <div className={`space-y-4 ${activeRole === 'afiliasi' ? '' : 'hidden'}`}>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Gaya Promosi</label>
                                <textarea value={brandProfile.afiliasi.persona} onChange={(e) => handleProfileChange('afiliasi', 'persona', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Soft selling, Storytelling pengalaman pribadi..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Target Pembeli</label>
                                <textarea value={brandProfile.afiliasi.audience} onChange={(e) => handleProfileChange('afiliasi', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Ibu rumah tangga, Pemburu diskon..."></textarea>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Strategi Unggulan</label>
                                <textarea value={brandProfile.afiliasi.usp} onChange={(e) => handleProfileChange('afiliasi', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-slate-100 placeholder-slate-500 transition" placeholder="Contoh: Kurasi produk viral, Info flash sale tercepat..."></textarea>
                             </div>
                        </div>
                    </div>
                     <div className="pt-6 flex items-center justify-between">
                         <button onClick={handleSave} className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all transform hover:-translate-y-0.5">Simpan Profil</button>
                         {status && <span className="text-xs font-medium text-green-400 animate-pulse">{status}</span>}
                    </div>
                </div>
            </div>

            
        </div>
    );
};

export default GuideStudio;
