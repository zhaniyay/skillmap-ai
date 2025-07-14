# backend/course_recommender.py
from sentence_transformers import SentenceTransformer
import faiss, numpy as np
import json, os

THIS_DIR = os.path.dirname(__file__)
COURSES_PATH = os.path.join(THIS_DIR, "courses.json")

class CourseRecommender:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.courses = json.load(open(COURSES_PATH, "r", encoding="utf-8"))
        descs = [c["desc"] for c in self.courses]
        embs = self.model.encode(descs).astype("float32")
        self.index = faiss.IndexFlatL2(embs.shape[1])
        self.index.add(embs)

    def recommend(self, gap_text, k=5):
        # Guard k so it never exceeds number of courses
        n = len(self.courses)
        if n == 0:
            return []
        k = min(k, n)

        emb = self.model.encode([gap_text]).astype("float32")
        D, I = self.index.search(emb, k)

        # Only keep valid courses
        recs = []
        for idx in I[0]:
            if 0 <= idx < n:
                recs.append(self.courses[idx])
        return recs
