from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os

DATABASE_PATH = os.getenv("DATABASE_PATH", "myshelf.db")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

def init_database():
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL
        )
    """)

    cursor.execute("PRAGMA table_info(items)")
    columns = cursor.fetchall()

    column_names = [column[1] for column in columns]

    if "status" not in column_names:
        cursor.execute("""
            ALTER TABLE items
            ADD COLUMN status TEXT DEFAULT 'planned'
        """)

    if "rating" not in column_names:
        cursor.execute("""
            ALTER TABLE items
            ADD COLUMN rating INTEGER
        """)
    
    connection.commit()
    connection.close()

init_database()

class Item(BaseModel):
    title: str
    type: str
    status: str
    rating: int | None = None

@app.get("/")
def root():
    return {"message": "Пивет алаз"}

@app.get("/items")
def get_items(
    type: str | None = None,
    status: str | None = None,
    sort: str | None = None,
    search: str | None = None
):
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    query = """
        SELECT id, title, type, status, rating
        FROM items
    """

    conditions = []
    values = []

    if type is not None:
        conditions.append("type = ?")
        values.append(type)

    
    if status is not None:
        conditions.append("status = ?")
        values.append(status)

    if search is not None:
        conditions.append("title LIKE ?")
        values.append("%" + search +"%")

    if len(conditions) > 0:
        query += " WHERE " + " AND ".join(conditions)

    if sort == "rating_desc":
        query += " ORDER BY rating IS NULL, rating DESC"
    elif sort == "rating_asc":
        query += " ORDER BY rating IS NULL, rating ASC"
    elif sort == "newest":
        query += " ORDER BY id DESC"
    else:
        query += " ORDER BY id"

    cursor.execute(query, values)

    rows = cursor.fetchall()
    
    connection.close()
    
    return [dict(row) for row in rows]

@app.post("/items")
def add_items(item: Item):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO items (title, type, status, rating)
        VALUES (?, ?, ?, ?)
        """,
        (item.title, item.type, item.status, item.rating)
    )

    connection.commit()

    item_id = cursor.lastrowid

    connection.close()

    return {
        "id": item_id,
        "title": item.title,
        "type": item.type,
        "status": item.status,
        "rating": item.rating
    }

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM items
        WHERE id = ?
        """,
        (item_id,)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Объект удален",
        "id": item_id
    }

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE items
        SET title = ?, type = ?, status = ?, rating = ?
        WHERE id = ?
        """,
        (item.title, item.type, item.status, item.rating, item_id)
    )

    connection.commit()
    connection.close()

    return{
        "id": item_id,
        "title": item.title,
        "type": item.type,
        "status": item.status,
        "rating": item.rating
    }