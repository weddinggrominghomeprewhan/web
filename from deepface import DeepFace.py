from deepface import DeepFace
import os, pandas as pd

embeddings = []
for file in os.listdir("faces"):
    path = f"faces/{file}"
    try:
        rep = DeepFace.represent(img_path=path, model_name='ArcFace', enforce_detection=False)
        vec = rep[0]['embedding']
        embeddings.append({'path': path, 'embedding': vec})
    except Exception:
        pass

df = pd.DataFrame(embeddings)
df.to_pickle("embeddings.pkl")  # บันทึกไว้ใช้ต่อ
