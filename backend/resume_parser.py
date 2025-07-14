import fitz  # PyMuPDF
import re


SKILL_KEYWORDS = [
    "python", "java", "c++", "pandas", "numpy", "machine learning", "deep learning",
    "sql", "tensorflow", "pytorch", "scikit-learn", "fastapi", "react", "docker"
]

def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text.lower()

def extract_skills(text):
    skills_found = []
    for keyword in SKILL_KEYWORDS:
        if re.search(r"\b" + re.escape(keyword) + r"\b", text):
            skills_found.append(keyword)
    return list(set(skills_found)) 
