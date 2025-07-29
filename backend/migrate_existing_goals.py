#!/usr/bin/env python3
"""
Migration script to update existing goals with structured roadmap data.
This script will parse the existing roadmap text and convert it to the new structured format.
"""

import sqlite3
import json
import re
from pathlib import Path

def parse_roadmap_text(roadmap_text):
    """Parse roadmap text into structured sections."""
    if not roadmap_text or not isinstance(roadmap_text, list):
        return {
            'cv_assessment': '',
            'skill_gaps': [],
            'learning_path': [],
            'cv_tips': []
        }
    
    # Convert roadmap array to text for parsing
    full_text = '\n'.join(roadmap_text) if isinstance(roadmap_text, list) else str(roadmap_text)
    
    # Initialize sections
    cv_assessment = ''
    skill_gaps = []
    learning_path = []
    cv_tips = []
    
    # Try to extract sections based on common patterns
    lines = full_text.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Detect section headers
        if any(keyword in line.lower() for keyword in ['assessment', 'overview', 'analysis']):
            current_section = 'cv_assessment'
            if not cv_assessment:
                cv_assessment = line
        elif any(keyword in line.lower() for keyword in ['skill', 'gap', 'missing', 'need']):
            current_section = 'skill_gaps'
        elif any(keyword in line.lower() for keyword in ['learning', 'path', 'step', 'course', 'study']):
            current_section = 'learning_path'
        elif any(keyword in line.lower() for keyword in ['tip', 'advice', 'recommendation', 'improve']):
            current_section = 'cv_tips'
        else:
            # Add content to current section
            if current_section == 'cv_assessment' and line:
                if cv_assessment:
                    cv_assessment += ' ' + line
                else:
                    cv_assessment = line
            elif current_section == 'skill_gaps' and line:
                skill_gaps.append(line)
            elif current_section == 'learning_path' and line:
                learning_path.append(line)
            elif current_section == 'cv_tips' and line:
                cv_tips.append(line)
    
    # If no structured sections found, create default ones from the roadmap
    if not cv_assessment and not skill_gaps and not learning_path and not cv_tips:
        cv_assessment = "Based on your profile, here's an assessment of your current skills and experience."
        
        # Extract potential skills and learning items
        for line in lines[:10]:  # First 10 items as skills
            if line.strip():
                skill_gaps.append(line.strip())
        
        for line in lines[10:]:  # Remaining as learning path
            if line.strip():
                learning_path.append(line.strip())
        
        cv_tips = [
            "Focus on building practical projects to demonstrate your skills",
            "Consider obtaining relevant certifications in your field",
            "Network with professionals in your target industry",
            "Keep your CV updated with latest achievements",
            "Tailor your CV for each job application"
        ]
    
    return {
        'cv_assessment': cv_assessment or "Your profile shows good potential for growth in your target field.",
        'skill_gaps': skill_gaps[:7] if skill_gaps else ["Technical skills", "Industry knowledge", "Practical experience"],
        'learning_path': learning_path[:10] if learning_path else ["Complete foundational courses", "Build practical projects", "Gain hands-on experience"],
        'cv_tips': cv_tips[:6] if cv_tips else ["Update your CV regularly", "Highlight key achievements", "Use action verbs"]
    }

def migrate_goals():
    """Migrate existing goals to new structured format."""
    db_path = Path("progress.db")
    
    if not db_path.exists():
        print("❌ Database not found. Please ensure progress.db exists.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all goals that need migration (missing structured fields)
        cursor.execute("""
            SELECT id, goal, roadmap, skills 
            FROM progress 
            WHERE cv_assessment IS NULL OR cv_assessment = ''
        """)
        
        goals_to_migrate = cursor.fetchall()
        
        if not goals_to_migrate:
            print("✅ No goals need migration. All goals already have structured data.")
            return
        
        print(f"🔄 Found {len(goals_to_migrate)} goals to migrate...")
        
        for goal_id, goal_name, roadmap_json, skills_json in goals_to_migrate:
            print(f"📝 Migrating goal: {goal_name}")
            
            # Parse existing roadmap
            try:
                roadmap_data = json.loads(roadmap_json) if roadmap_json else []
            except:
                roadmap_data = []
            
            # Generate structured data
            structured_data = parse_roadmap_text(roadmap_data)
            
            # Update the goal with structured data
            cursor.execute("""
                UPDATE progress 
                SET cv_assessment = ?, skill_gaps = ?, learning_path = ?, cv_tips = ?
                WHERE id = ?
            """, (
                structured_data['cv_assessment'],
                json.dumps(structured_data['skill_gaps']),
                json.dumps(structured_data['learning_path']),
                json.dumps(structured_data['cv_tips']),
                goal_id
            ))
            
            print(f"✅ Migrated {goal_name}")
            print(f"   - CV Assessment: {structured_data['cv_assessment'][:50]}...")
            print(f"   - Skill Gaps: {len(structured_data['skill_gaps'])} items")
            print(f"   - Learning Path: {len(structured_data['learning_path'])} steps")
            print(f"   - CV Tips: {len(structured_data['cv_tips'])} tips")
        
        conn.commit()
        print(f"\n🎉 Successfully migrated {len(goals_to_migrate)} goals!")
        print("💡 Refresh your browser to see the updated roadmap with beautiful headboxes!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Starting goal migration to structured format...")
    migrate_goals()
