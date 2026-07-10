"""
Build a fully self-contained, offline receipt page.

Reads the template (receipt-app/offline-template.html) and inlines:
  - the logo (public/titanium-geometry-full-color.svg -> base64 data URI)
  - html2canvas (node_modules/html2canvas/dist/html2canvas.min.js)
  - jsPDF        (node_modules/jspdf/dist/jspdf.umd.min.js)

Output: public/receipt-offline.html  (downloadable; works with no internet)

Re-run this whenever the template or logo changes:
    python receipt-app/build-offline.py
"""
import base64
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(path):
    with open(os.path.join(ROOT, path), "r", encoding="utf-8") as f:
        return f.read()

def read_bytes(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        return f.read()

def main():
    template = read("receipt-app/offline-template.html")

    svg = read_bytes("public/titanium-geometry-full-color.svg")
    logo_uri = "data:image/svg+xml;base64," + base64.b64encode(svg).decode("ascii")

    html2canvas = read("node_modules/html2canvas/dist/html2canvas.min.js")
    jspdf = read("node_modules/jspdf/dist/jspdf.umd.min.js")

    for token in ("{{LOGO}}", "{{HTML2CANVAS}}", "{{JSPDF}}"):
        if token not in template:
            raise SystemExit("ERROR: placeholder %s missing from template" % token)

    out = (template
           .replace("{{LOGO}}", logo_uri)
           .replace("{{HTML2CANVAS}}", html2canvas)
           .replace("{{JSPDF}}", jspdf))

    out_path = os.path.join(ROOT, "public", "receipt-offline.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out)

    print("Wrote public/receipt-offline.html  (%.0f KB)" % (len(out.encode("utf-8")) / 1024))

if __name__ == "__main__":
    main()
