import fitz  # PyMuPDF
import re
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text

def extract_skills(text):
    """Use AI to intelligently extract skills from resume text"""
    try:
        # Enhanced prompt for comprehensive skill extraction
        prompt = f"""
You are an expert resume analyzer. Extract ALL technical and professional skills from this resume text.

Resume Text:
{text}

Please extract and return a comprehensive list of skills including:
- Programming languages (Python, Java, JavaScript, etc.)
- Frameworks and libraries (React, Django, TensorFlow, etc.)
- Tools and software (Docker, Git, AWS, etc.)
- Databases (MySQL, PostgreSQL, MongoDB, etc.)
- Methodologies (Agile, Scrum, DevOps, etc.)
- Certifications and qualifications
- Domain expertise (Machine Learning, Data Analysis, etc.)
- Soft skills if clearly mentioned

Return ONLY a comma-separated list of skills, no explanations or formatting.
Example: Python, React, AWS, Machine Learning, Project Management
"""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Lower temperature for more consistent extraction
            max_tokens=500
        )
        
        skills_text = response.choices[0].message.content.strip()
        
        # Parse the comma-separated skills
        skills = [skill.strip() for skill in skills_text.split(',') if skill.strip()]
        
        # Remove duplicates and normalize
        unique_skills = list(set(skills))
        
        print(f"🤖 AI extracted {len(unique_skills)} skills: {unique_skills}")
        return unique_skills
        
    except Exception as e:
        print(f"❌ Error in AI skill extraction: {e}")
        # Fallback to basic keyword matching if AI fails
        return extract_skills_fallback(text)

def extract_skills_fallback(text):
    """Fallback skill extraction using keyword matching"""
    SKILL_KEYWORDS = [
        "python", "java", "javascript", "c++", "c#", "php", "ruby", "go", "rust",
        "react", "angular", "vue", "node.js", "django", "flask", "spring",
        "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn",
        "sql", "mysql", "postgresql", "mongodb", "redis",
        "docker", "kubernetes", "aws", "azure", "gcp", "git", "jenkins",
        "machine learning", "deep learning", "data analysis", "data science",
        "agile", "scrum", "devops", "ci/cd", "microservices"
    ]
    
    text_lower = text.lower()
    skills_found = []
    
    for keyword in SKILL_KEYWORDS:
        if re.search(r"\b" + re.escape(keyword.lower()) + r"\b", text_lower):
            skills_found.append(keyword.title())
    
    return list(set(skills_found)) 
