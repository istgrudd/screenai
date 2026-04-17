"""PDF text extraction service using PyMuPDF.

Extracts raw text from PDF files, handling multi-page documents.
Returns structured output with per-page text and file metadata.
"""

import os
import re

import fitz  # PyMuPDF


_EPRT_KEYWORDS = ("eprt", "english proficiency test")
_TOTAL_SCORE_RE = re.compile(
    r"TOTAL\s*SCORE[^\d]{0,20}(\d{3,4})",
    re.IGNORECASE,
)


def detect_certificate_type(text: str) -> str | None:
    """Detect whether the extracted text looks like a language certificate.

    Returns "eprt" for EPrT / English Proficiency Test documents,
    or None if it does not look like a certificate we handle.
    """
    if not text:
        return None
    lower = text.lower()
    for kw in _EPRT_KEYWORDS:
        if kw in lower:
            return "eprt"
    return None


def extract_eprt_score(text: str) -> int | None:
    """Extract the TOTAL SCORE value from an EPrT certificate's text.

    Looks for the "TOTAL SCORE" label followed by a 3-4 digit number.
    Valid EPrT range is 310–677; values outside that range are rejected.
    """
    if not text:
        return None
    match = _TOTAL_SCORE_RE.search(text)
    if not match:
        return None
    try:
        score = int(match.group(1))
    except (TypeError, ValueError):
        return None
    if 310 <= score <= 677:
        return score
    return None


def extract_text_from_pdf(pdf_path: str) -> dict:
    """Extract text content from a PDF file using PyMuPDF.

    Args:
        pdf_path: Absolute or relative path to the PDF file.

    Returns:
        {
            "raw_text": str,           # Full concatenated text from all pages
            "pages": list[str],        # Text content per page
            "metadata": {
                "page_count": int,
                "file_size_kb": float
            }
        }

    Raises:
        FileNotFoundError: If the PDF file does not exist.
        ValueError: If the file cannot be opened as a PDF.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    file_size_kb = os.path.getsize(pdf_path) / 1024.0

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise ValueError(f"Failed to open PDF '{pdf_path}': {e}")

    pages: list[str] = []

    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Extract text preserving reading order.
            # "text" sort mode gives natural top-to-bottom, left-to-right order.
            text = page.get_text("text")
            pages.append(text)
    finally:
        doc.close()

    raw_text = "\n".join(pages)

    return {
        "raw_text": raw_text,
        "pages": pages,
        "metadata": {
            "page_count": len(pages),
            "file_size_kb": round(file_size_kb, 2),
        },
    }
