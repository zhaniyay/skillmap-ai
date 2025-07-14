# backend/memory_manager.py
from sentence_transformers import SentenceTransformer
import faiss, numpy as np

class MemoryManager:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        dim = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(dim)
        self.meta = []

    def add(self, text, info):
        emb = self.model.encode([text]).astype("float32")
        self.index.add(emb)
        self.meta.append(info)

    def retrieve(self, text, k=3):
        # If no memory yet, return empty
        if len(self.meta) == 0:
            return []

        # Perform search
        emb = self.model.encode([text]).astype("float32")
        D, I = self.index.search(emb, min(k, len(self.meta)))

        # Only keep valid indices
        results = []
        for idx in I[0]:
            if idx < len(self.meta):
                results.append(self.meta[idx])
        return results
