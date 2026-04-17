"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Central configuration for the application.

    Values are loaded from a .env file at the project root,
    with environment variables taking precedence.
    """

    # --- DeepSeek LLM ---
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"

    # --- Database ---
    database_url: str = "sqlite:///./data/app.db"

    # --- Vector Store ---
    chroma_persist_dir: str = "./backend/vectorstore"

    # --- NER Model ---
    ner_model_name: str = "ageng-anugrah/indobert-large-p2-finetuned-ner"
    ner_cache_dir: str = "./models/ner"

    # --- Embedding Model ---
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"

    # --- App ---
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # --- Data directories ---
    raw_pdfs_dir: str = "./data/raw_pdfs"
    extracted_dir: str = "./data/extracted"
    anonymized_dir: str = "./data/anonymized"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    def ensure_data_dirs(self) -> None:
        """Create data directories if they don't exist."""
        for dir_path in [self.raw_pdfs_dir, self.extracted_dir, self.anonymized_dir]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
        Path(self.chroma_persist_dir).mkdir(parents=True, exist_ok=True)


settings = Settings()
