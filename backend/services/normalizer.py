"""Text normalization and section segmentation service.

Cleans up raw extracted PDF text (noise, whitespace) and segments
it into standard CV sections using heuristic heading detection.

Designed for Indonesian-language CVs with bilingual (ID/EN) headings.
"""

import re


# ---------------------------------------------------------------------------
# Section heading patterns (Indonesian + English)
#
# Each key maps to a list of regex patterns that can appear as a section
# heading in a CV.  Patterns are matched case-insensitively against lines
# that look like headings (short, often uppercase or title-case).
# ---------------------------------------------------------------------------

_SECTION_PATTERNS: dict[str, list[str]] = {
    "education": [
        r"pendidikan",
        r"riwayat\s+pendidikan",
        r"latar\s+belakang\s+pendidikan",
        r"education",
        r"educational\s+background",
        r"academic\s+background",
        r"riwayat\s+akademik",
    ],
    "experience": [
        r"pengalaman",
        r"pengalaman\s+kerja",
        r"pengalaman\s+organisasi",
        r"pengalaman\s+profesional",
        r"pengalaman\s+magang",
        r"pengalaman\s+relawan",
        r"experience",
        r"work\s+experience",
        r"professional\s+experience",
        r"organizational\s+experience",
        r"internship",
        r"volunteer",
        r"riwayat\s+pekerjaan",
        r"riwayat\s+karir",
    ],
    "skills": [
        r"keahlian",
        r"keterampilan",
        r"kemampuan",
        r"kompetensi",
        r"skills",
        r"technical\s+skills",
        r"soft\s+skills",
        r"hard\s+skills",
        r"kemampuan\s+teknis",
        r"tools?\s+(?:&|and|dan)\s+technolog",
    ],
    "certifications": [
        r"sertifikasi",
        r"sertifikat",
        r"pelatihan",
        r"training",
        r"certifications?",
        r"certificates?",
        r"lisensi",
        r"licenses?",
        r"courses?",
        r"kursus",
        r"seminar",
        r"workshop",
        r"penghargaan",
        r"awards?",
        r"achievements?",
        r"prestasi",
    ],
}

# Headings that should NOT be classified as a known section — they are
# typically preamble / header material (name, contact, summary).
_IGNORE_HEADINGS: list[str] = [
    r"curriculum\s+vitae",
    r"cv",
    r"resume",
    r"data\s+diri",
    r"informasi\s+pribadi",
    r"personal\s+info(?:rmation)?",
    r"contact",
    r"kontak",
    r"profil",
    r"profile",
    r"about\s+me",
    r"tentang\s+saya",
    r"summary",
    r"ringkasan",
    r"objective",
    r"tujuan",
]


def _normalize_text(raw_text: str) -> str:
    """Clean up noise in raw extracted PDF text.

    Steps:
        1. Replace non-breaking spaces and unusual whitespace with normal space.
        2. Remove control characters (except newline).
        3. Collapse multiple consecutive blank lines into one.
        4. Strip leading/trailing whitespace per line.
        5. Remove lines that are purely decorative (only dashes, underscores, etc.).
    """
    # Step 1 — normalize whitespace characters
    text = raw_text.replace("\u00a0", " ")  # NBSP
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[^\S\n]+", " ", text)  # collapse horizontal whitespace

    # Step 2 — strip control characters except \n
    text = re.sub(r"[\x00-\x09\x0b-\x0c\x0e-\x1f\x7f]", "", text)

    # Step 3 — strip each line, remove decorative-only lines
    lines: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        # Skip lines that are only dashes, underscores, dots, equals, pipes
        if stripped and re.fullmatch(r"[\-_=.:|*#~+>]+", stripped):
            continue
        lines.append(stripped)

    # Step 4 — collapse multiple blank lines into one
    result_lines: list[str] = []
    prev_blank = False
    for line in lines:
        if line == "":
            if not prev_blank:
                result_lines.append("")
            prev_blank = True
        else:
            result_lines.append(line)
            prev_blank = False

    return "\n".join(result_lines).strip()


def _is_heading_line(line: str) -> bool:
    """Heuristic: is this line likely a section heading?

    A heading line is typically short (< 80 chars), may be uppercase
    or title-cased, and does not end with common sentence punctuation.
    """
    stripped = line.strip()
    if not stripped:
        return False
    if len(stripped) > 80:
        return False
    # Ends with sentence punctuation → probably not a heading
    if stripped[-1] in ".;,":
        return False
    return True


def _match_section(line: str) -> str | None:
    """Return the section key if `line` matches a known heading, else None."""
    clean = line.strip().lower()
    # Remove common leading markers: bullets, numbering, roman numerals
    clean = re.sub(r"^[\d\.\)\-\•\▪\◦\–]+\s*", "", clean)
    clean = re.sub(r"^[ivxlc]+[\.\)]\s*", "", clean)
    clean = clean.strip(" :-")

    if not clean:
        return None

    # Check if this is an ignored heading (preamble)
    for pattern in _IGNORE_HEADINGS:
        if re.fullmatch(pattern, clean):
            return None

    # Check against known sections
    for section, patterns in _SECTION_PATTERNS.items():
        for pattern in patterns:
            if re.fullmatch(pattern, clean) or re.match(pattern, clean):
                return section

    return None


def normalize_and_segment(raw_text: str) -> dict:
    """Normalize raw CV text and segment it into standard sections.

    Args:
        raw_text: Raw text extracted from a PDF by the extractor.

    Returns:
        {
            "normalized_text": str,
            "sections": {
                "education": str,
                "experience": str,
                "skills": str,
                "certifications": str,
                "other": str
            }
        }

    The "other" section captures content that doesn't fall under any
    recognized heading (typically the preamble: name, contact info,
    objective, summary).
    """
    normalized = _normalize_text(raw_text)

    if not normalized:
        return {
            "normalized_text": "",
            "sections": {
                "education": "",
                "experience": "",
                "skills": "",
                "certifications": "",
                "other": "",
            },
        }

    # --- Pass 1: identify heading positions ---
    lines = normalized.split("\n")
    # Each entry: (line_index, section_key)
    headings: list[tuple[int, str]] = []

    for i, line in enumerate(lines):
        if not _is_heading_line(line):
            continue
        section = _match_section(line)
        if section is not None:
            headings.append((i, section))

    # --- Pass 2: assign lines to sections ---
    sections: dict[str, list[str]] = {
        "education": [],
        "experience": [],
        "skills": [],
        "certifications": [],
        "other": [],
    }

    if not headings:
        # No headings detected — everything goes to "other"
        sections["other"] = lines
    else:
        # Lines before the first heading → "other"
        first_heading_idx = headings[0][0]
        sections["other"].extend(lines[:first_heading_idx])

        # Lines between headings → respective section
        for idx, (start, section_key) in enumerate(headings):
            if idx + 1 < len(headings):
                end = headings[idx + 1][0]
            else:
                end = len(lines)

            # Skip the heading line itself, take content below it
            content_lines = lines[start + 1 : end]
            sections[section_key].extend(content_lines)

    # --- Clean up: join and strip each section ---
    result_sections = {}
    for key, section_lines in sections.items():
        text = "\n".join(section_lines).strip()
        result_sections[key] = text

    return {
        "normalized_text": normalized,
        "sections": result_sections,
    }
