"""Demo Mode rubric seed + helpers (exhibition Demo Mode).

The **single source of truth** for what the demo page shows and scores is the
``rubrics`` table: any rubric whose name starts with the ``[DEMO]`` prefix is a
demo-visible position. ``DEMO_POSITIONS`` below is NOT a runtime data source —
it is only seed data for ``ensure_demo_rubrics``, which bootstraps two default
``[DEMO]`` rubrics so the demo is never empty (idempotent + reset-safe).

At runtime the router queries the table via ``list_demo_rubrics`` /
``get_demo_rubric`` so rubrics created/edited from the admin Rubrics page show
up automatically, without code changes or a restart.
"""

from sqlalchemy.orm import Session

from backend.models.rubric import Rubric, Dimension


# Rubrics whose name begins with this prefix are "demo-visible" positions.
DEMO_PREFIX = "[DEMO] "
_DEMO_PREFIX_BARE = "[DEMO]"


# Seed data for the two default demo rubrics created by ``ensure_demo_rubrics``.
# ``rubric_name`` is the lookup/creation key in the rubrics table.
DEMO_POSITIONS: list[dict] = [
    {
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

def is_demo_rubric_name(name: str | None) -> bool:
    """True if a rubric name marks it as a demo-visible position."""
    return bool(name) and name.startswith(_DEMO_PREFIX_BARE)


def strip_demo_prefix(name: str) -> str:
    """Return the display label for a demo rubric (name without ``[DEMO]``)."""
    if name.startswith(DEMO_PREFIX):
        return name[len(DEMO_PREFIX):].strip()
    if name.startswith(_DEMO_PREFIX_BARE):
        return name[len(_DEMO_PREFIX_BARE):].strip()
    return name


def ensure_demo_rubrics(db: Session) -> list[int]:
    """Bootstrap the two default demo rubrics if missing; return their ids.

    Idempotent — looks up each rubric by its unique ``rubric_name`` and only
    creates it (plus dimensions) when absent. Safe to call on every request
    and after a DB reset; it never duplicates or overwrites admin edits.
    """
    ensured: list[int] = []
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
        ensured.append(rubric.id)

    db.commit()
    return ensured


def list_demo_rubrics(db: Session) -> list[dict]:
    """Return demo-visible rubrics (``[DEMO]`` prefix) for the public dropdown.

    The rubrics table is the single source of truth: every ``[DEMO]`` rubric —
    the seeded defaults and any created via the admin Rubrics page — appears
    here. ``id`` is the rubric id (resolved live, never hardcoded), ``title``/
    ``label`` is the name without the prefix.
    """
    rubrics = (
        db.query(Rubric)
        .filter(Rubric.name.like("[DEMO]%"))
        .order_by(Rubric.created_at.asc(), Rubric.id.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "title": strip_demo_prefix(r.name),
            "label": strip_demo_prefix(r.name),
            "description": r.description,
            "dimension_count": len(r.dimensions),
        }
        # Python-side guard so only genuine [DEMO] rubrics are ever exposed.
        for r in rubrics
        if is_demo_rubric_name(r.name)
    ]


def get_demo_rubric(db: Session, rubric_id: int) -> Rubric | None:
    """Return the rubric for ``rubric_id`` only if it is a [DEMO] rubric.

    Returns None when the rubric does not exist or is NOT demo-visible. This
    is the security gate for the public ``/evaluate`` endpoint: it must never
    let a public request score against an arbitrary internal rubric.
    """
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if rubric is None or not is_demo_rubric_name(rubric.name):
        return None
    return rubric
