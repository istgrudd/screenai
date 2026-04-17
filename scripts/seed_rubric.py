"""Seed a default rubric for the "Junior Data Analyst" position.

Usage:
    python -m scripts.seed_rubric

This script can be run multiple times — it checks if the rubric
already exists before creating it.
"""

import sys
import os

# Add project root to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, init_db
from backend.models.rubric import Rubric, Dimension
import backend.models  # noqa: F401 — register models with Base


RUBRIC_DATA = {
    "name": "Junior Data Analyst Screening",
    "position": "Junior Data Analyst",
    "description": (
        "Rubrik penilaian untuk posisi Junior Data Analyst. "
        "Mengevaluasi kompetensi teknis, pengalaman proyek, "
        "kemampuan komunikasi, dan growth mindset kandidat "
        "fresh graduate / entry-level."
    ),
    "dimensions": [
        {
            "name": "Technical Proficiency",
            "weight": 0.35,
            "description": (
                "Kemampuan teknis kandidat dalam tools dan bahasa pemrograman "
                "yang relevan untuk data analysis. Mencakup pemahaman dasar "
                "machine learning dan pengalaman data preprocessing."
            ),
            "indicators": [
                "Python programming",
                "SQL / database querying",
                "Data tools: Pandas, NumPy, Matplotlib",
                "Visualization tools: Tableau, Power BI, Google Data Studio",
                "ML libraries: Scikit-learn, TensorFlow, PyTorch",
                "Google Colab / Jupyter Notebook usage",
                "Basic ML concepts: classification, regression, clustering",
                "Data preprocessing: cleaning, transformation, feature engineering",
                "Version control: Git/GitHub",
                "Cloud platforms: GCP, AWS basics",
            ],
        },
        {
            "name": "Analytical & Project Experience",
            "weight": 0.25,
            "description": (
                "Pengalaman kandidat dalam proyek data/ML, termasuk proyek "
                "akademik (tugas kuliah, skripsi/tugas akhir), kompetisi data, "
                "atau proyek mandiri. Dinilai dari pendekatan problem-solving "
                "dan hasil yang terukur."
            ),
            "indicators": [
                "Data analysis or ML projects (academic projects count)",
                "Measurable outcomes or results from projects",
                "Problem-solving approach documentation",
                "Thesis or final project with data analysis component",
                "Coursework involving statistical analysis or data science",
                "Competition participation (Kaggle, hackathons, data challenges)",
                "Capstone or portfolio projects",
                "Research experience with data methodology",
            ],
        },
        {
            "name": "Communication & Teamwork",
            "weight": 0.20,
            "description": (
                "Kemampuan kandidat berkomunikasi, bekerja dalam tim, dan "
                "menjelaskan konsep teknis. Termasuk pengalaman organisasi "
                "dan pengalaman lintas fungsi."
            ),
            "indicators": [
                "Organizational roles or leadership positions",
                "Team collaboration evidence in projects",
                "Presentation or public speaking experience",
                "Ability to explain technical concepts to non-technical audience",
                "Cross-functional team experience",
                "Committee or event organizing experience",
                "Mentoring or teaching experience",
                "Written communication (reports, documentation, articles)",
            ],
        },
        {
            "name": "Growth Mindset",
            "weight": 0.20,
            "description": (
                "Bukti bahwa kandidat memiliki kemauan belajar mandiri, "
                "inisiatif untuk mengeksplorasi tools/teknologi baru di luar "
                "kurikulum, serta keragaman pengembangan keterampilan."
            ),
            "indicators": [
                "Self-learning evidence (online courses, certifications, bootcamps)",
                "Exposure to new tools beyond coursework curriculum",
                "Initiative in personal or side projects",
                "Curiosity demonstrated through diverse skill development",
                "Continuous learning: multiple courses or certifications over time",
                "Participation in tech communities, meetups, or workshops",
                "Open-source contributions or personal blog/portfolio",
                "Adaptability: experience with multiple domains or technologies",
            ],
        },
    ],
}


def seed_rubric():
    """Create the default Junior Data Analyst rubric if it doesn't exist."""
    init_db()
    db = SessionLocal()

    try:
        # Check if rubric already exists
        existing = (
            db.query(Rubric)
            .filter(Rubric.position == RUBRIC_DATA["position"])
            .first()
        )

        if existing:
            print(f"[SKIP] Rubric for '{RUBRIC_DATA['position']}' already exists (id={existing.id})")
            return existing.id

        # Create rubric
        rubric = Rubric(
            name=RUBRIC_DATA["name"],
            position=RUBRIC_DATA["position"],
            description=RUBRIC_DATA["description"],
        )
        db.add(rubric)
        db.flush()

        # Create dimensions
        for dim_data in RUBRIC_DATA["dimensions"]:
            dim = Dimension(
                rubric_id=rubric.id,
                name=dim_data["name"],
                weight=dim_data["weight"],
                description=dim_data["description"],
                indicators=dim_data["indicators"],
            )
            db.add(dim)

        db.commit()
        print(f"[OK] Rubric created: '{rubric.name}' (id={rubric.id})")
        print(f"     Position: {rubric.position}")
        print(f"     Dimensions: {len(RUBRIC_DATA['dimensions'])}")
        for dim_data in RUBRIC_DATA["dimensions"]:
            print(f"       - {dim_data['name']} ({dim_data['weight']*100:.0f}%)")

        return rubric.id

    finally:
        db.close()


if __name__ == "__main__":
    seed_rubric()
