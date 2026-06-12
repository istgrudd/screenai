"""Hardcoded demo positions + their scoring rubrics (exhibition Demo Mode).

The demo page exposes two fixed positions. Each maps to a real Rubric
(with Dimensions) so the demo evaluation reuses the exact same RAG
pipeline as the production flow. ``ensure_demo_rubrics`` is idempotent:
it creates the rubrics on first use and is safe to call repeatedly.
"""

from sqlalchemy.orm import Session

from backend.models.rubric import Rubric, Dimension


# Demo positions are addressed by a stable ``position_id`` from the frontend
# dropdown. ``rubric_name`` is the lookup/creation key in the rubrics table.
DEMO_POSITIONS: list[dict] = [
    {
        "id": 1,
        "title": "Data Science Intern",
        "rubric_name": "[DEMO] Data Science Intern",
        "description": (
            "Magang Data Science untuk mahasiswa/fresh graduate. Fokus pada "
            "Python, analisis data, dasar machine learning, dan kemampuan "
            "mengkomunikasikan temuan dari data."
        ),
        "dimensions": [
            {
                "name": "Technical Proficiency",
                "weight": 0.35,
                "description": (
                    "Penguasaan tools dan bahasa untuk data science: Python, "
                    "SQL, dan library analisis/ML."
                ),
                "indicators": [
                    "Python programming",
                    "SQL / database querying",
                    "Pandas, NumPy, Matplotlib",
                    "Scikit-learn / TensorFlow / PyTorch",
                    "Jupyter Notebook / Google Colab",
                    "Konsep ML dasar: klasifikasi, regresi, clustering",
                ],
            },
            {
                "name": "Project & Analytical Experience",
                "weight": 0.30,
                "description": (
                    "Pengalaman mengerjakan proyek data/ML, termasuk proyek "
                    "akademik, skripsi, kompetisi, atau proyek mandiri."
                ),
                "indicators": [
                    "Proyek analisis data atau machine learning",
                    "Hasil terukur dari proyek",
                    "Skripsi / tugas akhir dengan komponen data",
                    "Kompetisi data (Kaggle, hackathon)",
                    "Portfolio atau capstone project",
                ],
            },
            {
                "name": "Communication & Collaboration",
                "weight": 0.20,
                "description": (
                    "Kemampuan menjelaskan insight data dan bekerja dalam tim."
                ),
                "indicators": [
                    "Pengalaman organisasi atau kepemimpinan",
                    "Kolaborasi tim dalam proyek",
                    "Presentasi atau public speaking",
                    "Menjelaskan konsep teknis ke audiens non-teknis",
                ],
            },
            {
                "name": "Growth Mindset",
                "weight": 0.15,
                "description": (
                    "Kemauan belajar mandiri dan eksplorasi tools/teknologi baru."
                ),
                "indicators": [
                    "Self-learning (online course, sertifikasi, bootcamp)",
                    "Inisiatif pada proyek pribadi",
                    "Eksplorasi tools di luar kurikulum",
                    "Aktif di komunitas tech / meetup",
                ],
            },
        ],
    },
    {
        "id": 2,
        "title": "Backend Engineer Intern",
        "rubric_name": "[DEMO] Backend Engineer Intern",
        "description": (
            "Magang Backend Engineer untuk mahasiswa/fresh graduate. Fokus "
            "pada pemrograman backend, REST API, database, dan praktik "
            "rekayasa perangkat lunak."
        ),
        "dimensions": [
            {
                "name": "Backend Engineering Skills",
                "weight": 0.40,
                "description": (
                    "Penguasaan bahasa backend, framework, REST API, dan "
                    "database."
                ),
                "indicators": [
                    "Bahasa backend: Python, Java, Go, Node.js, PHP",
                    "Framework: FastAPI, Django, Spring, Express, Laravel",
                    "Desain dan konsumsi REST API",
                    "Database SQL / NoSQL (PostgreSQL, MySQL, MongoDB)",
                    "Autentikasi, caching, atau message queue",
                    "Docker / containerization",
                ],
            },
            {
                "name": "Project & Engineering Experience",
                "weight": 0.30,
                "description": (
                    "Pengalaman membangun aplikasi/sistem backend pada proyek "
                    "akademik maupun mandiri."
                ),
                "indicators": [
                    "Proyek aplikasi web/backend",
                    "Skripsi / tugas akhir berbasis sistem",
                    "Deploy aplikasi ke server atau cloud",
                    "Portfolio atau capstone project",
                    "Hasil terukur dari proyek",
                ],
            },
            {
                "name": "Software Engineering Practices",
                "weight": 0.15,
                "description": (
                    "Praktik rekayasa: version control, testing, dokumentasi."
                ),
                "indicators": [
                    "Git / GitHub",
                    "Unit testing atau integration testing",
                    "Dokumentasi kode / API",
                    "CI/CD atau code review",
                ],
            },
            {
                "name": "Communication & Growth Mindset",
                "weight": 0.15,
                "description": (
                    "Kolaborasi tim dan kemauan belajar teknologi baru."
                ),
                "indicators": [
                    "Kolaborasi tim dalam proyek",
                    "Pengalaman organisasi",
                    "Self-learning dan sertifikasi",
                    "Kontribusi open-source atau blog teknis",
                ],
            },
        ],
    },
]

_POSITION_BY_ID = {p["id"]: p for p in DEMO_POSITIONS}


def get_demo_position(position_id: int) -> dict | None:
    """Return the demo position config for an id, or None if unknown."""
    return _POSITION_BY_ID.get(position_id)


def list_demo_positions() -> list[dict]:
    """Return the public position list for the frontend dropdown."""
    return [
        {"id": p["id"], "title": p["title"], "description": p["description"]}
        for p in DEMO_POSITIONS
    ]


def ensure_demo_rubrics(db: Session) -> dict[int, int]:
    """Create the demo rubrics if missing; return {position_id: rubric_id}.

    Idempotent — looks up each rubric by its unique ``rubric_name`` and only
    creates it (plus dimensions) when absent. Safe to call on every request.
    """
    mapping: dict[int, int] = {}
    for pos in DEMO_POSITIONS:
        rubric = (
            db.query(Rubric)
            .filter(Rubric.name == pos["rubric_name"])
            .first()
        )
        if rubric is None:
            rubric = Rubric(
                name=pos["rubric_name"],
                position=pos["title"],
                description=pos["description"],
            )
            db.add(rubric)
            db.flush()
            for dim in pos["dimensions"]:
                db.add(
                    Dimension(
                        rubric_id=rubric.id,
                        name=dim["name"],
                        weight=dim["weight"],
                        description=dim["description"],
                        indicators=dim["indicators"],
                    )
                )
            db.flush()
        mapping[pos["id"]] = rubric.id

    db.commit()
    return mapping


def resolve_rubric_id(db: Session, position_id: int) -> int | None:
    """Resolve a demo position_id to its rubric id, creating rubrics if needed."""
    if position_id not in _POSITION_BY_ID:
        return None
    mapping = ensure_demo_rubrics(db)
    return mapping.get(position_id)
