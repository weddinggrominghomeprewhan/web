#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, csv, json, glob, os, collections

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--clusters', required=True)
    ap.add_argument('--names', required=True)
    ap.add_argument('--manifests', default='manifests')
    ap.add_argument('--tag-prefix', default='person')
    args = ap.parse_args()

    id2name = {}
    with open(args.names, 'r', encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        for row in r:
            try:
                cid = int(row['cluster_id'])
                id2name[cid] = row['name'].strip()
            except:
                pass

    face2cluster = {}
    with open(args.clusters, 'r', encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        for row in r:
            face2cluster[row['face_id']] = int(row['cluster_id'])

    manifest_files = sorted(glob.glob(os.path.join(args.manifests, 'page_*.json')))
    idx = collections.defaultdict(list)
    for mpath in manifest_files:
        with open(mpath, 'r', encoding='utf-8') as fh:
            arr = json.load(fh)
        for i, it in enumerate(arr):
            base = os.path.basename(it.get('full', ''))
            idx[base].append((mpath, i))

    applied = 0
    for face_id, cid in face2cluster.items():
        tag = f"{args.tag_prefix}:{id2name.get(cid, f'cluster_{cid:03d}')}"
        for mpath, i in idx.get(face_id, []):
            with open(mpath, 'r', encoding='utf-8') as fh:
                arr = json.load(fh)
            tags = list(arr[i].get('tags', []))
            if tag not in tags:
                tags.append(tag)
                arr[i]['tags'] = tags
                applied += 1
            with open(mpath, 'w', encoding='utf-8') as fh:
                json.dump(arr, fh, ensure_ascii=False, separators=(',', ':'))

    print(f"[ok] applied {applied} tags")

if __name__ == '__main__':
    main()
