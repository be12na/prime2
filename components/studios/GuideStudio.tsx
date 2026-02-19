
import React, { useState, useEffect } from 'react';
import { BRAND_ROLES } from '../../constants.ts';

type BrandRole = 'produk' | 'kreator' | 'afiliasi';

const GuideStudio: React.FC = () => {
    const [activeRole, setActiveRole] = useState<BrandRole>('produk');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<{ message: string; type: 'success' | 'info' }>({ message: '', type: 'info' });

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
            setBrandProfile(JSON.parse(savedProfile));
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
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setApiKeyStatus({ message: 'Kunci API yang tersimpan telah dihapus.', type: 'info' });
        }
        setTimeout(() => setApiKeyStatus({ message: '', type: 'info' }), 4000);
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
                <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto">Selamat datang di PRIME! Atur identitas Anda dan pelajari cara memaksimalkan setiap studio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 md:p-8 space-y-4 shadow-2xl shadow-black/30">
                    <h3 className="text-xl font-semibold text-orange-400">Pengaturan Kunci API</h3>
                    <div className="space-y-2 pt-2">
                        <p className="text-sm text-slate-400 mb-4">
                            Masukkan Kunci API Google AI Studio Anda di bawah ini untuk mengaktifkan semua fitur AI. Kunci Anda akan disimpan dengan aman di sesi browser Anda.
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
                                Simpan Kunci
                            </button>
                        </div>
                        {apiKeyStatus.message && (
                            <div className={`flex items-center gap-2 p-3 mt-2 text-sm rounded-lg ${
                                apiKeyStatus.type === 'success' 
                                ? 'text-green-300 bg-green-500/10 border border-green-500/20' 
                                : 'text-sky-300 bg-sky-500/10 border border-sky-500/20'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{apiKeyStatus.message}</span>
                            </div>
                        )}
                        <div className="prose prose-sm prose-invert text-slate-300 max-w-none space-y-3 pt-4">
                            <p>Kunci API gratis dan mudah didapatkan dari Google AI Studio. Ikuti langkah-langkah berikut:</p>
                            <ol>
                                <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Google AI Studio API Key page</a>.</li>
                                <li>Masuk dengan akun Google Anda.</li>
                                <li>Klik tombol <strong>"Create API key in new project"</strong>.</li>
                                <li>Salin (copy) kunci yang baru dibuat dan tempel di kolom di atas.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 md:p-8 space-y-4 shadow-2xl shadow-black/30">
                    <h3 className="text-xl font-semibold text-orange-400">Pusat Identitas Cerdas</h3>
                    <div className="flex flex-wrap items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                        {BRAND_ROLES.map(role => (
                            <button key={role.id} onClick={() => setActiveRole(role.id as BrandRole)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeRole === role.id ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                {role.label}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Forms */}
                    <div className="pt-4 border-t border-slate-700">
                        {/* Product Profile */}
                        <div className={`space-y-4 ${activeRole === 'produk' ? '' : 'hidden'}`}>
                             <textarea value={brandProfile.produk.style} onChange={(e) => handleProfileChange('produk', 'style', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Persona Brand Produk..."></textarea>
                             <textarea value={brandProfile.produk.audience} onChange={(e) => handleProfileChange('produk', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Target Pasar Produk..."></textarea>
                             <textarea value={brandProfile.produk.usp} onChange={(e) => handleProfileChange('produk', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Unique Selling Proposition (USP) Produk..."></textarea>
                        </div>
                        {/* Creator Profile */}
                        <div className={`space-y-4 ${activeRole === 'kreator' ? '' : 'hidden'}`}>
                             <textarea value={brandProfile.kreator.persona} onChange={(e) => handleProfileChange('kreator', 'persona', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Persona & Gaya Konten Anda..."></textarea>
                             <textarea value={brandProfile.kreator.audience} onChange={(e) => handleProfileChange('kreator', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Komunitas & Niche Audiens Anda..."></textarea>
                             <textarea value={brandProfile.kreator.usp} onChange={(e) => handleProfileChange('kreator', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Keunikan / USP Anda sebagai Kreator..."></textarea>
                        </div>
                        {/* Affiliate Profile */}
                        <div className={`space-y-4 ${activeRole === 'afiliasi' ? '' : 'hidden'}`}>
                             <textarea value={brandProfile.afiliasi.persona} onChange={(e) => handleProfileChange('afiliasi', 'persona', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Persona & Gaya Konten Anda (Sebagai Afiliator)..."></textarea>
                             <textarea value={brandProfile.afiliasi.audience} onChange={(e) => handleProfileChange('afiliasi', 'audience', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Komunitas & Niche Audiens Anda..."></textarea>
                             <textarea value={brandProfile.afiliasi.usp} onChange={(e) => handleProfileChange('afiliasi', 'usp', e.target.value)} rows={3} className="w-full bg-slate-700/50 p-2 rounded" placeholder="Keunikan / USP Anda sebagai Afiliator..."></textarea>
                        </div>
                    </div>
                     <div className="pt-4 flex items-center gap-3">
                         <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">Simpan Profil</button>
                         <p className="text-xs text-green-400">{status}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideStudio;
