import React from 'react';

interface GeminiErrorNoticeProps {
  message: string;
}

const getGeminiErrorGuidance = (message: string): { title: string; steps: string[] } => {
  const normalized = message.toLowerCase();

  if (normalized.includes('429') || normalized.includes('quota') || normalized.includes('too many requests')) {
    return {
      title: 'Quota Gemini sedang habis atau kena rate limit (429)',
      steps: [
        'Tunggu 1-5 menit lalu klik generate lagi.',
        'Pakai model yang lebih ringan di Pengaturan API (mis. gemini-2.5-flash).',
        'Cek sisa quota di Google AI Studio, lalu lanjut saat quota sudah reset.',
      ],
    };
  }

  if (normalized.includes('403') || normalized.includes('api key not valid') || normalized.includes('permission')) {
    return {
      title: 'API key Gemini tidak valid atau akses ditolak (403)',
      steps: [
        'Buka menu Panduan & Pengaturan lalu simpan ulang API key Gemini yang benar.',
        'Pastikan key berasal dari project Google AI Studio yang aktif.',
        'Jika baru membuat key, tunggu sebentar lalu coba generate ulang.',
      ],
    };
  }

  if (normalized.includes('404') || normalized.includes('not found')) {
    return {
      title: 'Model Gemini tidak ditemukan (404)',
      steps: [
        'Ganti ke model yang umum tersedia, misalnya gemini-2.5-flash.',
        'Jika pakai custom model ID, periksa ejaan model di Pengaturan API.',
        'Simpan ulang pengaturan model lalu coba generate kembali.',
      ],
    };
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out')
  ) {
    return {
      title: 'Koneksi ke API Gemini sedang bermasalah',
      steps: [
        'Periksa internet Anda lalu refresh halaman.',
        'Coba generate ulang setelah beberapa detik.',
        'Jika masih gagal, coba ganti jaringan atau nonaktifkan VPN/proxy sementara.',
      ],
    };
  }

  if (normalized.includes('kunci api gemini tidak diatur') || normalized.includes('api key') && normalized.includes('tidak diatur')) {
    return {
      title: 'API key Gemini belum diatur',
      steps: [
        'Masuk ke menu Panduan & Pengaturan.',
        'Isi API key Gemini Anda lalu klik Simpan & Validasi.',
        'Kembali ke studio ini dan coba generate lagi.',
      ],
    };
  }

  if (normalized.includes('gagal mem-parsing') || normalized.includes('json')) {
    return {
      title: 'Respons AI tidak sesuai format yang diharapkan',
      steps: [
        'Klik generate sekali lagi.',
        'Sederhanakan input yang terlalu panjang atau terlalu kompleks.',
        'Jika perlu, ganti ke model yang lebih stabil seperti gemini-2.5-flash.',
      ],
    };
  }

  return {
    title: 'Terjadi kendala saat menghubungi API Gemini',
    steps: [
      'Coba generate ulang dalam beberapa detik.',
      'Pastikan API key valid di menu Panduan & Pengaturan.',
      'Jika berulang, ganti model API ke gemini-2.5-flash lalu coba lagi.',
    ],
  };
};

const GeminiErrorNotice: React.FC<GeminiErrorNoticeProps> = ({ message }) => {
  const guidance = getGeminiErrorGuidance(message);

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left">
      <h4 className="text-sm font-semibold text-red-300">Notifikasi Error API Gemini</h4>
      <p className="mt-2 text-sm text-red-200">{guidance.title}</p>
      <p className="mt-2 text-xs text-red-100/90">Detail teknis: {message}</p>
      <div className="mt-3 space-y-1">
        {guidance.steps.map((step) => (
          <p key={step} className="text-xs text-red-100/95">- {step}</p>
        ))}
      </div>
    </div>
  );
};

export default GeminiErrorNotice;
