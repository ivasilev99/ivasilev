"""Render certificate PDFs to WebP previews: python3 _build/render-certs.py (needs pymupdf and cwebp)."""
import json, os, subprocess, tempfile
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'certs')
OUT = os.path.join(SRC, 'preview')
os.makedirs(OUT, exist_ok=True)

def webp(pix, dest, q):
    with tempfile.NamedTemporaryFile(suffix='.png') as t:
        pix.save(t.name)
        subprocess.run(['cwebp', '-quiet', '-q', str(q), t.name, '-o', dest], check=True)

manifest = {}
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.pdf'):
        continue
    slug = name[:-4]
    doc = pymupdf.open(os.path.join(SRC, name))
    pages = []
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1600 / page.rect.width, 1600 / page.rect.width), alpha=False)
        webp(pix, os.path.join(OUT, f'{slug}-{i}.webp'), 82)
        pages.append([pix.width, pix.height])
    manifest[slug] = {'pages': pages}

with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=1)
print(json.dumps(manifest))
