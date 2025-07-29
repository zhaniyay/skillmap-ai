#!/usr/bin/env python3
"""
Database migration script to add structured roadmap fields to Progress table.
Run this script to update existing database schema.
"""

import os
import sqlite3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_database():
    """Add new structured roadmap fields to Progress table"""
    
    # Get database URL
    db_url = os.getenv("PROGRESS_DB_URL", "sqlite:///progress.db")
    
    # Extract database path from SQLite URL
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
    else:
        print(f"❌ Unsupported database URL format: {db_url}")
        return False
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if new columns already exist
        cursor.execute("PRAGMA table_info(progress)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = ['cv_assessment', 'skill_gaps', 'learning_path', 'cv_tips']
        columns_to_add = [col for col in new_columns if col not in columns]
        
        if not columns_to_add:
            print("✅ Database schema is already up to date!")
            return True
        
        print(f"🔄 Adding new columns: {columns_to_add}")
        
        # Add new columns
        for column in columns_to_add:
            if column == 'cv_assessment':
                cursor.execute(f"ALTER TABLE progress ADD COLUMN {column} TEXT DEFAULT ''")
            else:
                cursor.execute(f"ALTER TABLE progress ADD COLUMN {column} TEXT DEFAULT '[]'")
            print(f"  ✅ Added column: {column}")
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    success = migrate_database()
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")
        exit(1)
