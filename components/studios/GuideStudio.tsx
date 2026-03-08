
import React, { useState, useEffect } from 'react';
import { BRAND_ROLES } from '../../constants.ts';
import { GoogleGenAI } from "@google/genai";

type BrandRole = 'produk' | 'kreator' | 'afiliasi';

const GuideStudio: React.FC = () => {
    const [activeRole, setActiveRole] = useState<BrandRole>('produk');
    const [apiKey, setApiKey] = useState('');
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
    }, []);

    const handleSaveApiKey = () => {
        if (apiKey.trim()) {
            sessionStorage.setItem('geminiApiKey', apiKey.trim());
            setApiKeyStatus({ message: 'Kunci API berhasil disimpan untuk sesi ini!', type: 'success' });
            // Auto-trigger validation logic after save
            validateApiKey(apiKey.trim());
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

    const validateApiKey = async (key: string) => {
        setQuotaCheckStatus('checking');
        setApiKeyStatus({ message: 'Memvalidasi kunci API dan jenis quota...', type: 'info' });
        
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            
            // Mencoba model yang paling stabil dan umum tersedia (gemini-1.5-flash)
            // Model experimental (gemini-2.0-flash-exp) seringkali restricted atau memiliki endpoint berbeda
            const modelName = 'gemini-1.5-flash'; 
            
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
                {/* Kolom Kiri: Pengaturan API & Quota */}
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

                    {/* 2. Panduan Quota & Billing (NEW SECTION) */}
                    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl shadow-black/30">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-orange-400 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Manajemen Quota & Billing
                            </h3>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">PENTING</span>
                        </div>

                        {/* Visual Reference Free Tier */}
                        <div className="bg-white p-4 rounded-lg border border-slate-300">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Referensi Tampilan (Wajib)</p>
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                                <span className="text-slate-800 font-medium">Quota Tier</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-blue-600 font-medium text-sm">Activate billing</div>
                                    <div className="text-slate-500 text-xs">Free trial</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm text-slate-300">
                            <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                                <h4 className="font-bold text-orange-400 mb-2">1. Wajib Menggunakan Free Tier</h4>
                                <p className="mb-2">Sistem PRIME didesain untuk berjalan optimal pada <strong>Free Tier</strong>. Pastikan dashboard Google AI Studio Anda menunjukkan status "Activate billing / Free trial" seperti gambar di atas.</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-400">
                                    <li>Gratis selamanya (selama dalam batas quota).</li>
                                    <li>Cukup untuk penggunaan harian standar.</li>
                                    <li>Tidak memerlukan Kartu Kredit.</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    LARANGAN KERAS: "Setup Billing - Unavailable"
                                </h4>
                                <p>Jika status akun Anda "Setup Billing - Unavailable", <strong>DILARANG KERAS</strong> menggunakan API key tersebut. Status ini menandakan akun Google Cloud Anda bermasalah, ditangguhkan, atau belum terverifikasi lokasinya.</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-200">2. Cara Aktivasi Billing (Pay-as-you-go)</h4>
                                <p className="text-slate-400">Jika Anda membutuhkan quota lebih tinggi (misal untuk produksi massal), Anda bisa mengaktifkan billing:</p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-2">
                                    <li>Klik "Activate billing" di dashboard.</li>
                                    <li>Hubungkan dengan akun Google Cloud Billing (Wajib Kartu Kredit/Debit).</li>
                                    <li><strong>Konsekuensi:</strong> Anda akan dikenakan biaya jika penggunaan melebihi batas gratis. Pastikan Anda memantau penggunaan biaya di Google Cloud Console.</li>
                                </ol>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-200">3. Troubleshooting Quota</h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                                    <li><strong>Error 429 (Too Many Requests):</strong> Anda telah mencapai batas harian/menit Free Tier. Tunggu beberapa saat atau ganti ke akun lain.</li>
                                    <li><strong>Error 403 (Permission Denied):</strong> API Key salah atau Project telah dihapus.</li>
                                    <li><strong>Response Lambat:</strong> Server Google sedang sibuk, coba lagi nanti.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Pusat Identitas (Existing) */}
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

            {/* Developer Documentation for Alternative APIs */}
            <div className="mt-12 pt-8 border-t border-slate-700/50">
                <div className="bg-slate-900/50 backdrop-blur-lg border border-indigo-500/30 rounded-xl p-6 md:p-8 space-y-8 shadow-2xl shadow-indigo-500/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-indigo-400 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                Integrasi API Alternatif (Developer Guide)
                            </h3>
                            <p className="mt-2 text-slate-400 text-sm">Panduan komprehensif untuk memperluas kapabilitas PRIME dengan penyedia AI lain (OpenAI, Grok, Anthropic, dll).</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 self-start md:self-center">ADVANCED</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm text-slate-300">
                        {/* 1. Supported APIs */}
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">1. Dukungan API Alternatif</h4>
                            <p>Saat ini PRIME dioptimalkan untuk Google Gemini (Free Tier). Namun, arsitektur sistem mendukung integrasi dengan provider lain yang kompatibel dengan standar REST API atau SDK modern:</p>
                            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                                <li><strong className="text-emerald-400">OpenAI (GPT-4/3.5):</strong> Standar industri, performa tinggi, berbayar.</li>
                                <li><strong className="text-white">xAI (Grok):</strong> Alternatif dengan akses real-time (via X), kompatibel dengan OpenAI SDK.</li>
                                <li><strong className="text-amber-400">Anthropic (Claude):</strong> Unggul dalam penulisan kreatif dan coding, memerlukan SDK terpisah.</li>
                                <li><strong className="text-sky-400">Mistral AI:</strong> Opsi open-weight yang efisien dan cost-effective.</li>
                            </ul>
                        </section>

                        {/* 2. Configuration Steps */}
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">2. Konfigurasi & Autentikasi</h4>
                            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto">
                                <p className="text-slate-500 mb-2"># Contoh Header Request (OpenAI/Grok)</p>
                                <p><span className="text-purple-400">Authorization:</span> Bearer YOUR_API_KEY</p>
                                <p><span className="text-purple-400">Content-Type:</span> application/json</p>
                                <br/>
                                <p className="text-slate-500 mb-2"># Endpoints</p>
                                <p>OpenAI: <span className="text-green-400">https://api.openai.com/v1/chat/completions</span></p>
                                <p>Grok: <span className="text-white">https://api.grok.x.ai/v1/chat/completions</span></p>
                                <p>Mistral: <span className="text-sky-400">https://api.mistral.ai/v1/chat/completions</span></p>
                            </div>
                            <p className="text-xs text-slate-400 italic">*Rate Limit berbeda untuk setiap provider. Cek dokumentasi resmi masing-masing layanan.</p>
                        </section>

                        {/* 3. Code Implementation */}
                        <section className="space-y-4 lg:col-span-2">
                            <h4 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">3. Implementasi Kode (Adapter Pattern)</h4>
                            <p>Untuk mendukung multi-provider, disarankan menggunakan pola Adapter pada file <code>services/geminiService.ts</code> (atau rename menjadi <code>aiService.ts</code>):</p>
                            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto">
<pre>{`// Interface Generik untuk AI Provider
interface AIProvider {
    generateContent(prompt: string): Promise<string>;
}

// Implementasi OpenAI / Grok (Kompatibel)
class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private baseURL: string; // Bisa diganti untuk Grok/Mistral

    constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    async generateContent(prompt: string): Promise<string> {
        const response = await fetch(\`\${this.baseURL}/chat/completions\`, {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${this.apiKey}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo', // Sesuaikan model
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) throw new Error(\`API Error: \${response.status}\`);
        const data = await response.json();
        return data.choices[0].message.content;
    }
}`}</pre>
                            </div>
                        </section>

                        {/* 4. Compatibility Matrix */}
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">4. Matriks Kompatibilitas Fitur</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400">
                                            <th className="py-2">Fitur</th>
                                            <th className="py-2">Gemini (Current)</th>
                                            <th className="py-2">OpenAI/Grok</th>
                                            <th className="py-2">Claude</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        <tr className="border-b border-slate-800">
                                            <td className="py-2 font-medium">Text Gen</td>
                                            <td className="text-green-400">Supported</td>
                                            <td className="text-green-400">Supported</td>
                                            <td className="text-green-400">Supported</td>
                                        </tr>
                                        <tr className="border-b border-slate-800">
                                            <td className="py-2 font-medium">Vision Analysis</td>
                                            <td className="text-green-400">Supported</td>
                                            <td className="text-green-400">GPT-4V Only</td>
                                            <td className="text-yellow-400">Limited</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 font-medium">JSON Mode</td>
                                            <td className="text-green-400">Native</td>
                                            <td className="text-green-400">Native</td>
                                            <td className="text-yellow-400">Prompt Eng.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 5. Migration, Testing & Troubleshooting */}
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">5. Migrasi, Testing & Troubleshooting</h4>
                            <div className="space-y-3">
                                <div>
                                    <strong className="text-slate-200 block mb-1">Panduan Migrasi:</strong>
                                    <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-1">
                                        <li>Backup file <code>geminiService.ts</code>.</li>
                                        <li>Buat file adapter baru sesuai contoh di poin 3.</li>
                                        <li>Ganti import di komponen React untuk menggunakan adapter baru.</li>
                                    </ol>
                                </div>
                                <div className="mt-2">
                                     <strong className="text-slate-200 block mb-1">Testing Requirements:</strong>
                                     <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
                                        <li>Verifikasi format output JSON/Markdown konsisten antar provider.</li>
                                        <li>Uji penanganan error (simulasikan putus koneksi/invalid key).</li>
                                        <li>Pastikan token usage tidak melebihi budget (jika berbayar).</li>
                                     </ul>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <strong className="text-slate-200 block mb-1">Troubleshooting Umum:</strong>
                                    <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
                                        <li><span className="text-red-400">Error 401:</span> Kunci API salah atau kadaluarsa.</li>
                                        <li><span className="text-red-400">Error 429:</span> Rate limit tercapai. Implementasikan <em>exponential backoff</em>.</li>
                                        <li><span className="text-red-400">CORS Error:</span> Gunakan proxy server jika API memblokir request browser.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideStudio;
