# detect_and_embed.py
# ใช้ InsightFace (onnxruntime) สำหรับ detect + embedding
# pip install insightface opencv-python Pillow

import os, json, csv, pathlib, shutil
from insightface.app import FaceAnalysis
import cv2
import numpy as np

def ensure_dir(p): os.makedirs(p, exist_ok=True)

def main(src_dir="WEDDING", out_dir="faces_out", min_face_size=40):
    src = pathlib.Path(src_dir)
    out = pathlib.Path(out_dir)
    ensure_dir(out)
    crops_dir = out / "crops"
    ensure_dir(crops_dir)
    meta_csv = out / "faces.csv"

    # prepare insightface: ใช้ CPU (onnxruntime)
    app = FaceAnalysis(allowed_modules=['detection','recognition'])
    # ctx_id=-1 means CPU; det_size เลือกตามภาพ (512..1024)
    app.prepare(ctx_id=-1, det_size=(640,640))

    rows = []
    total = 0
    exts = {'.jpg','.jpeg','.png','.webp','.heic','.heif','.tif','.tiff'}

    for p in sorted(src.rglob("*")):
        if p.suffix.lower() not in exts: continue
        img_bgr = cv2.imread(str(p))
        if img_bgr is None:
            # try via PIL for odd paths
            try:
                from PIL import Image
                im = Image.open(p).convert('RGB')
                img_bgr = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
            except Exception:
                continue

        faces = app.get(img_bgr)
        if not faces: continue
        for i, f in enumerate(faces):
            x1,y1,x2,y2 = map(int, f.bbox[:4])
            w = x2-x1; h = y2-y1
            if max(w,h) < min_face_size: continue
            # pad crop a bit
            pad = int(0.18 * max(w,h))
            x0 = max(0, x1 - pad); y0 = max(0, y1 - pad)
            x1 = min(img_bgr.shape[1], x2 + pad); y1 = min(img_bgr.shape[0], y2 + pad)
            crop = img_bgr[y0:y1, x0:x1]
            fid = f"{total:08d}"
            crop_path = crops_dir / f"{fid}.jpg"
            cv2.imwrite(str(crop_path), crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])

            # embedding (f.embedding is numpy array)
            emb = f.embedding.tolist() if hasattr(f,'embedding') else []
            rows.append([fid, str(p), str(crop_path), x0, y0, x1-x0, y1-y0, json.dumps(emb, ensure_ascii=False)])
            total += 1

    # write CSV faces.csv: face_id,image_path,crop_path,x,y,w,h,embedding_json
    with open(meta_csv, 'w', encoding='utf-8', newline='') as fh:
        w = csv.writer(fh)
        w.writerow(['face_id','image_path','crop_path','x','y','w','h','embedding'])
        w.writerows(rows)
    print(f"[ok] detected {total} faces -> {meta_csv}")

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='WEDDING')
    ap.add_argument('--out', default='faces_out')
    ap.add_argument('--min-face', type=int, default=40)
    args = ap.parse_args()
    main(args.src, args.out, args.min_face)
