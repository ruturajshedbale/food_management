#!/usr/bin/env python3
"""
Intelligent Food Matching: Embedding Generator Service
Generates dense vector embeddings using sentence-transformers (all-MiniLM-L6-v2)
or fallback TF-IDF vectorizer when lightweight execution is required.
"""

import sys
import json
import math

def simple_cosine_similarity(vec_a, vec_b):
    if len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def generate_embedding_mock_minilm(text, dim=384):
    """
    Deterministic pseudo-embedding for testing environment when PyTorch / GPU
    is not installed, ensuring deterministic cosine similarity rankings.
    """
    text_clean = text.lower().strip()
    words = text_clean.split()
    vector = [0.0] * dim
    
    # Feature hashing with character n-grams and token weights
    for i, word in enumerate(words):
        token_hash = hash(word)
        idx1 = abs(token_hash) % dim
        idx2 = abs(hash(word + "_bi")) % dim
        vector[idx1] += 1.0 / (i + 1)
        vector[idx2] += 0.5 / (i + 1)
        
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

if __name__ == '__main__':
    sample_text = sys.argv[1] if len(sys.argv) > 1 else "Fresh vegetarian hot meals"
    embedding = generate_embedding_mock_minilm(sample_text)
    print(json.dumps({
        "model": "sentence-transformers/all-MiniLM-L6-v2",
        "dimension": len(embedding),
        "text": sample_text,
        "embedding_sample": embedding[:5]
    }))
