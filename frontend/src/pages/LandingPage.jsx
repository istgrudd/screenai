import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Users,
  FileSearch,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Blind Screening",
    description:
      "Identitas kandidat dianonimkan secara otomatis via IndoBERT NER — nama, institusi, dan gender tidak mempengaruhi penilaian. Seleksi yang adil dan bebas bias.",
  },
  {
    icon: BrainCircuit,
    title: "RAG-Based Evaluation",
    description:
      "Pipeline Retrieval-Augmented Generation mencocokkan kompetensi kandidat terhadap rubrik rekruter menggunakan LangChain + ChromaDB + DeepSeek V3.",
  },
  {
    icon: Lightbulb,
    title: "Explainable AI (XAI)",
    description:
      "Setiap skor didukung justifikasi berbasis bukti dari CV kandidat. Rekruter tahu persis mengapa seorang kandidat mendapat nilai tertentu.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: FileSearch,
    title: "Upload CV",
    description: "Kandidat upload CV dan sertifikat bahasa dalam format PDF.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Anonimisasi Otomatis",
    description: "Sistem menghapus semua identitas sebelum evaluasi dimulai.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Evaluasi AI",
    description: "RAG pipeline menilai kompetensi berdasarkan rubrik posisi.",
  },
  {
    number: "04",
    icon: Users,
    title: "Keputusan Rekruter",
    description: "Rekruter review ranking, override jika perlu, reveal identitas.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                      px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">ScreenAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-blue-600 hover:bg-blue-500 transition-colors
                       text-white px-4 py-2 rounded-lg font-medium"
          >
            Coba Sekarang
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center
                          min-h-screen text-center px-6 pt-20 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 px-4 py-1.5
                        rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400
                        text-xs font-medium tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Capstone Project — MBC Laboratory, Telkom University
        </div>

        {/* Heading */}
        <h1 className="relative text-5xl md:text-7xl font-bold tracking-tight
                       leading-tight max-w-4xl mb-6">
          Rekrutasi{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400
                           bg-clip-text text-transparent">
            Lebih Cerdas
          </span>
          <br />
          Tanpa Bias
        </h1>

        {/* Subtitle */}
        <p className="relative text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          Platform AI yang mengotomatiskan CV screening dengan blind anonymization,
          evaluasi berbasis RAG, dan justifikasi transparan untuk setiap keputusan.
        </p>

        {/* CTA buttons */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                       transition-colors text-white px-8 py-3.5 rounded-xl
                       font-semibold text-base shadow-lg shadow-blue-600/30"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 border border-white/20 hover:border-white/40
                       hover:bg-white/5 transition-colors text-white/80 hover:text-white
                       px-8 py-3.5 rounded-xl font-medium text-base"
          >
            Sudah punya akun? Sign in
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2
                        flex flex-col items-center gap-2 text-white/30 text-xs">
          <span>Scroll untuk lihat fitur</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">
              Teknologi
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Tiga Pilar Utama
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Kombinasi NER, RAG, dan XAI untuk screening yang akurat, adil, dan transparan.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-2xl border border-white/10
                           bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-500/30
                           transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20
                                flex items-center justify-center mb-6
                                group-hover:bg-blue-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">
              Alur Sistem
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Cara Kerja
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Dari upload CV hingga keputusan rekruter dalam empat langkah.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)]
                                  right-[-calc(50%-2rem)] h-px bg-gradient-to-r
                                  from-blue-500/50 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center p-6
                                rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30
                                  flex items-center justify-center mb-4 relative">
                    <step.icon className="w-6 h-6 text-blue-400" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full
                                     bg-blue-600 text-white text-[10px] font-bold
                                     flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Siap mencoba?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Daftar sebagai kandidat dan upload CV kamu sekarang.
            Rekruter akan mengevaluasi tanpa melihat identitasmu.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                       transition-colors text-white px-10 py-4 rounded-xl
                       font-semibold text-lg shadow-lg shadow-blue-600/30"
          >
            Daftar Gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center
                        justify-between gap-4 text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            <span>ScreenAI</span>
          </div>
          <span>Capstone Design © 2026 — MBC Laboratory, Telkom University</span>
        </div>
      </footer>

    </div>
  );
}
