"""Generate a sample Indonesian CV as a PDF for smoke testing.

Creates a realistic-looking CV in data/raw_pdfs/sample_cv.pdf
"""

import fitz  # PyMuPDF

CV_TEXT = """CURRICULUM VITAE

Nama: Budi Santoso
Alamat: Jl. Merdeka No. 45, Surabaya, Jawa Timur
Telepon: 081234567890
Email: budi.santoso@email.com
Tanggal Lahir: 15 Maret 2001

---

PENDIDIKAN

S1 Teknik Informatika - Institut Teknologi Sepuluh Nopember (ITS)
IPK: 3.72 / 4.00
2019 - 2023

SMA Negeri 5 Surabaya
Jurusan IPA
2016 - 2019

---

PENGALAMAN KERJA

Software Engineer Intern - PT Tokopedia
Januari 2023 - Juni 2023
- Mengembangkan fitur backend menggunakan Go dan PostgreSQL
- Meningkatkan performa API sebesar 30% melalui optimasi query
- Berkolaborasi dengan tim product dan design dalam sprint agile

Asisten Laboratorium - Lab Pemrograman ITS
Agustus 2021 - Desember 2022
- Membimbing 40+ mahasiswa dalam praktikum struktur data dan algoritma
- Menyusun modul praktikum dan soal ujian
- Mengembangkan sistem auto-grading menggunakan Python

---

KEAHLIAN

Bahasa Pemrograman: Python, Java, Go, JavaScript, SQL
Framework: Django, FastAPI, React, Node.js
Tools: Git, Docker, Linux, PostgreSQL, Redis
Soft Skills: Kepemimpinan, Komunikasi, Problem Solving, Kerja Tim

---

SERTIFIKASI

AWS Certified Cloud Practitioner - Amazon Web Services (2023)
Google IT Support Professional Certificate - Coursera (2022)
TOEFL ITP: 550 (2022)
Sertifikat EPrT: 520 (2023)

---

PENGALAMAN ORGANISASI

Ketua Divisi Teknologi - Himpunan Mahasiswa Informatika ITS
2021 - 2022
- Memimpin tim 15 orang dalam pengembangan website himpunan
- Menyelenggarakan workshop pemrograman untuk 200+ peserta

Volunteer - Bangkit Academy by Google, GoTo, Traveloka
2022
- Menyelesaikan learning path Machine Learning
- Mengembangkan capstone project klasifikasi gambar medis
"""


def create_sample_cv(output_path: str) -> None:
    """Create a PDF file with sample Indonesian CV content."""
    doc = fitz.open()

    # --- Page 1 ---
    page = doc.new_page(width=595, height=842)  # A4

    # Simple text insertion — split into manageable blocks
    lines = CV_TEXT.strip().split("\n")
    y = 50
    for line in lines:
        if line.strip() == "---":
            y += 5
            continue
        if y > 790:
            page = doc.new_page(width=595, height=842)
            y = 50
        page.insert_text(
            (50, y),
            line,
            fontsize=10,
            fontname="helv",
        )
        y += 14

    doc.save(output_path)
    doc.close()
    print(f"[OK] Sample CV saved to: {output_path}")


if __name__ == "__main__":
    create_sample_cv("data/raw_pdfs/sample_cv.pdf")
