#!/usr/bin/env python3
"""
Fix migration script to properly use the original detailed roadmap as learning_path
instead of creating simplified learning paths.
"""

import sqlite3
import json
from pathlib import Path

def fix_migration():
    """Fix the migration by using the original detailed roadmap as learning_path."""
    db_path = Path("progress.db")
    
    if not db_path.exists():
        print("❌ Database not found.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all goals that need fixing
        cursor.execute("""
            SELECT id, goal, roadmap, cv_assessment, skill_gaps, cv_tips 
            FROM progress 
        """)
        
        goals_to_fix = cursor.fetchall()
        
        print(f"🔄 Found {len(goals_to_fix)} goals to fix...")
        
        for goal_id, goal_name, roadmap_json, cv_assessment, skill_gaps, cv_tips in goals_to_fix:
            print(f"📝 Fixing goal: {goal_name}")
            
            # Parse existing roadmap
            try:
                original_roadmap = json.loads(roadmap_json) if roadmap_json else []
            except:
                original_roadmap = []
            
            # Use the original detailed roadmap as learning_path
            # Keep first 15 items as learning path (trackable with checkboxes)
            learning_path = original_roadmap[:15] if len(original_roadmap) > 15 else original_roadmap
            
            # Ensure we have good skill gaps
            try:
                current_skill_gaps = json.loads(skill_gaps) if skill_gaps else []
            except:
                current_skill_gaps = []
            
            if not current_skill_gaps or len(current_skill_gaps) < 3:
                # Generate better skill gaps based on goal
                if 'ml' in goal_name.lower() or 'machine learning' in goal_name.lower():
                    current_skill_gaps = [
                        "Deep Learning and Neural Networks",
                        "Computer Vision and Image Processing", 
                        "Natural Language Processing",
                        "MLOps and Model Deployment",
                        "Advanced Statistics and Mathematics",
                        "Big Data Processing (Spark, Hadoop)",
                        "Cloud ML Platforms (AWS, GCP, Azure)"
                    ]
                elif 'data' in goal_name.lower():
                    current_skill_gaps = [
                        "Advanced SQL and Database Design",
                        "Statistical Analysis and Hypothesis Testing",
                        "Data Visualization and Storytelling",
                        "Big Data Technologies",
                        "Machine Learning for Analytics",
                        "Business Intelligence Tools"
                    ]
                else:
                    current_skill_gaps = [
                        "Technical Skills Enhancement",
                        "Industry-Specific Knowledge", 
                        "Practical Project Experience",
                        "Professional Communication",
                        "Problem-Solving Methodologies"
                    ]
            
            # Ensure we have good CV tips
            try:
                current_cv_tips = json.loads(cv_tips) if cv_tips else []
            except:
                current_cv_tips = []
                
            if not current_cv_tips or len(current_cv_tips) < 3:
                current_cv_tips = [
                    "Highlight specific technical projects with measurable outcomes",
                    "Include relevant certifications and continuous learning efforts", 
                    "Use action verbs and quantify your achievements where possible",
                    "Tailor your CV to match the job requirements and keywords",
                    "Include a professional summary that showcases your unique value proposition"
                ]
            
            # Update the goal with better structured data
            cursor.execute("""
                UPDATE progress 
                SET learning_path = ?, skill_gaps = ?, cv_tips = ?
                WHERE id = ?
            """, (
                json.dumps(learning_path),
                json.dumps(current_skill_gaps[:7]),  # Limit to 7 skill gaps
                json.dumps(current_cv_tips[:5]),     # Limit to 5 CV tips
                goal_id
            ))
            
            print(f"✅ Fixed {goal_name}")
            print(f"   - Learning Path: {len(learning_path)} detailed steps")
            print(f"   - Skill Gaps: {len(current_skill_gaps[:7])} items")
            print(f"   - CV Tips: {len(current_cv_tips[:5])} tips")
        
        conn.commit()
        print(f"\n🎉 Successfully fixed {len(goals_to_fix)} goals!")
        print("💡 The learning path now uses the original detailed roadmap steps!")
        
    except Exception as e:
        print(f"❌ Fix failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 Fixing migration to use detailed learning paths...")
    fix_migration()
