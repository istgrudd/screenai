import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Users,
  FileSearch,
  Sparkles,
  Target,
  GraduationCap,
  Building2,
  FlaskConical,
  Calendar,
  Linkedin,
  Github,
  Mail,
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

// Narasi capstone — di-draft dari konteks halaman. Sesuaikan jika perlu.
const ABOUT_PROJECT = [
  {
    icon: Lightbulb,
    title: "Latar Belakang",
    description:
      "Proses CV screening manual rentan terhadap bias — nama, gender, dan asal institusi kerap mempengaruhi penilaian. Di sisi lain, rekruter kewalahan menyaring ratusan pelamar secara konsisten dan objektif, sehingga kandidat potensial bisa terlewat.",
  },
  {
    icon: Target,
    title: "Tujuan & Manfaat",
    description:
      "ScreenAI mengotomatiskan tahap awal seleksi melalui anonimisasi identitas, evaluasi berbasis rubrik dengan RAG, dan justifikasi yang transparan. Hasilnya: proses seleksi yang lebih adil, cepat, dan akuntabel bagi rekruter maupun kandidat.",
  },
];

// Info akademik capstone.
// TODO: ganti nama dosen pembimbing dengan data asli.
const ACADEMIC_INFO = [
  { icon: GraduationCap, label: "Dosen Pembimbing", value: "Nama Dosen Pembimbing, S.T., M.T." },
  { icon: FlaskConical, label: "Laboratorium", value: "MBC Laboratory" },
  { icon: Building2, label: "Institusi", value: "Telkom University" },
  { icon: Calendar, label: "Tahun", value: "2026" },
];

// Tim pengembang.
// TODO: lengkapi/ganti dengan data anggota tim yang sebenarnya.
//  - photo: taruh file di /public/team/ lalu isi path-nya (mis. "/team/rudi.jpg").
//    Biarkan null untuk memakai avatar inisial otomatis.
//  - linkedin/github/email: isi yang tersedia, kosongkan ("") yang tidak ada.
const TEAM = [
  {
    name: "Rudi Firdaus",
    role: "Project Lead / ML Engineer",
    nim: "TODO-NIM",
    prodi: "S1 Informatika",
    photo: null,
    linkedin: "",
    github: "",
    email: "digitalrudi14@gmail.com",
  },
  {
    name: "Nama Anggota 2",
    role: "Backend Engineer",
    nim: "TODO-NIM",
    prodi: "S1 Informatika",
    photo: null,
    linkedin: "",
    github: "",
    email: "",
  },
  {
    name: "Nama Anggota 3",
    role: "Frontend Engineer",
    nim: "TODO-NIM",
    prodi: "S1 Informatika",
    photo: null,
    linkedin: "",
    github: "",
    email: "",
  },
];

// Inisial dari nama untuk avatar fallback (mis. "Rudi Firdaus" -> "RF").
function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

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
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#about"
            className="hidden sm:inline-flex items-center text-sm text-white/70
                       hover:text-white transition-colors px-3 py-2"
          >
            Tentang
          </a>
          <Link
            to="/demo"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/70
                       hover:text-white transition-colors px-3 py-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Coba Demo
          </Link>
          <Link
            to="/login"
            className="text-sm text-white/70 hover:text-white transition-colors px-3 sm:px-4 py-2"
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
            to="/demo"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                       transition-colors text-white px-8 py-3.5 rounded-xl
                       font-semibold text-base shadow-lg shadow-blue-600/30"
          >
            <Sparkles className="w-4 h-4" />
            Coba Demo
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 border border-white/20 hover:border-white/40
                       hover:bg-white/5 transition-colors text-white/80 hover:text-white
                       px-8 py-3.5 rounded-xl font-medium text-base"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
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

      {/* ── About ── */}
      <section id="about" className="py-24 px-6 border-t border-white/10 scroll-mt-20">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">
              Tentang
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              About Project
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Mengenal lebih dekat capstone project ScreenAI dan tim di baliknya.
            </p>
          </div>

          {/* Project narrative */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {ABOUT_PROJECT.map((item) => (
              <div
                key={item.title}
                className="p-8 rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20
                                flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Academic info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20
                          p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
            {ACADEMIC_INFO.map((info) => (
              <div key={info.label} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/20
                                flex items-center justify-center">
                  <info.icon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/40 text-xs uppercase tracking-wider">
                  {info.label}
                </span>
                <span className="text-white/80 text-sm font-medium">{info.value}</span>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">
              Tim Pengembang
            </p>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
              Orang di Balik ScreenAI
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="group flex flex-col items-center text-center p-8 rounded-2xl
                           border border-white/10 bg-white/[0.03]
                           hover:bg-white/[0.06] hover:border-blue-500/30
                           transition-all duration-300"
              >
                {/* Avatar */}
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mb-5
                               border-2 border-blue-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mb-5 flex items-center justify-center
                                  text-xl font-bold text-white
                                  bg-gradient-to-br from-blue-500 to-cyan-500
                                  border-2 border-blue-500/30">
                    {getInitials(member.name)}
                  </div>
                )}

                <h4 className="text-lg font-semibold">{member.name}</h4>
                <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full
                                 bg-blue-500/10 border border-blue-500/30
                                 text-blue-400 text-xs font-medium">
                  {member.role}
                </span>
                <p className="mt-3 text-white/50 text-sm">{member.nim}</p>
                <p className="text-white/40 text-xs">{member.prodi}</p>

                {/* Social links */}
                {(member.linkedin || member.github || member.email) && (
                  <div className="flex items-center gap-3 mt-5">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`LinkedIn ${member.name}`}
                        className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03]
                                   flex items-center justify-center text-white/50
                                   hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`GitHub ${member.name}`}
                        className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03]
                                   flex items-center justify-center text-white/50
                                   hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        aria-label={`Email ${member.name}`}
                        className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03]
                                   flex items-center justify-center text-white/50
                                   hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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
