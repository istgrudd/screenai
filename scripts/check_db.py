"""Quick script to verify database tables exist."""
import sqlite3

conn = sqlite3.connect("data/app.db")
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print(f"Tables found: {tables}")

for table in tables:
    cursor = conn.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    print(f"  {table}: {cols}")

conn.close()
