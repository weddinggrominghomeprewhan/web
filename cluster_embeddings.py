# cluster_embeddings.py
# pip install scikit-learn hdbscan numpy

import os, csv, json, pathlib, numpy as np, shutil
from sklearn.cluster import DBSCAN
try:
    import hdbscan
    HDBSCAN_AVAILABLE = True
except Exception:
    HDBSCAN_AVAILABLE = False

def load_embeddings(faces_csv):
    rows = []
    with open(faces_csv, 'r', encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        for row in r:
            emb = json.loads(row['embedding'])
            rows.append({'face_id': row['face_id'], 'image_path': row['image_path'],
                         'crop_path': row['crop_path'], 'embedding': np.array(emb, dtype=np.float32)})
    return rows

def cluster_rows(rows, method='hdbscan', eps=0.6, min_samples=3, min_cluster_size=3):
    X = np.stack([r['embedding'] for r in rows if r['embedding'].size>0])
    idx_map = [i for i,r in enumerate(rows) if r['embedding'].size>0]
    if method=='hdbscan' and HDBSCAN_AVAILABLE:
        cl = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, min_samples=min_samples, metric='euclidean')
        labels = cl.fit_predict(X)
    else:
        db = DBSCAN(eps=eps, min_samples=min_samples, metric='euclidean')
        labels = db.fit_predict(X)
    # map back to full rows: assign -1 for missing
    labels_full = [-1]*len(rows)
    for i,label in zip(idx_map, labels):
        labels_full[i]=int(label)
    return labels_full

def materialize_clusters(rows, labels, out_dir='face_clusters'):
    out = pathlib.Path(out_dir)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    from collections import defaultdict
    groups = defaultdict(list)
    for r,lab in zip(rows, labels):
        groups[lab].append(r['crop_path'])
    for lab, lst in groups.items():
        cdir = out / f"cluster_{lab:03d}"
        cdir.mkdir(parents=True, exist_ok=True)
        for p in lst:
            try:
                shutil.copy(p, cdir / pathlib.Path(p).name)
            except Exception:
                pass
    # write clusters.csv: face_id,cluster_id,crop_path
    with open(out / 'clusters.csv', 'w', encoding='utf-8', newline='') as fh:
        import csv
        w = csv.writer(fh)
        w.writerow(['face_id','cluster_id','crop_path'])
        for r,lab in zip(rows, labels):
            w.writerow([r['face_id'], lab, r['crop_path']])
    print(f"[ok] materialized {len(groups)} clusters at {out}")

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--faces', default='faces_out/faces.csv')
    ap.add_argument('--out', default='face_clusters')
    ap.add_argument('--method', default='hdbscan', choices=['hdbscan','dbscan'])
    ap.add_argument('--eps', type=float, default=0.6)
    ap.add_argument('--min-samples', type=int, default=3)
    ap.add_argument('--min-cluster-size', type=int, default=3)
    args = ap.parse_args()

    rows = load_embeddings(args.faces)
    labels = cluster_rows(rows, method=args.method, eps=args.eps,
                          min_samples=args.min_samples, min_cluster_size=args.min_cluster_size)
    materialize_clusters(rows, labels, out_dir=args.out)
