# Face Tagging Addon
วิธีใช้:
1. ตรวจสอบให้มีไฟล์ face_clusters/clusters.csv และ manifests/page_*.json
2. แก้ไข map_clusters_to_names.csv ให้ตรงกับชื่อบุคคลจริง
3. รัน:
   python apply_person_tags.py --clusters face_clusters/clusters.csv --names map_clusters_to_names.csv --manifests manifests --tag-prefix person
