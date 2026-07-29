"""
Apply AI-generated descriptions to products.json.

Give it the JSON that ChatGPT returns — an array of {"id": ..., "description": ...}.
It updates the matching products, backs up products.json first, and writes the file
in the same format the admin tool uses.

    python apply_descriptions.py descriptions.json

The input file may include ```json ... ``` code fences (they're stripped),
or be a bare JSON array.
"""
import json
import os
import re
import shutil
import sys

PROJECT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(PROJECT, "data", "products.json")


def load_input(path):
    text = open(path, encoding="utf-8").read().strip()
    # Strip a leading/trailing markdown code fence if present.
    text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
    text = re.sub(r"\s*```$", "", text).strip()
    obj = json.loads(text)
    if isinstance(obj, dict) and "descriptions" in obj:
        obj = obj["descriptions"]
    if not isinstance(obj, list):
        raise ValueError("Expected a JSON array of {id, description} objects.")
    return obj


def main():
    if len(sys.argv) < 2:
        print("Usage: python apply_descriptions.py <descriptions.json>")
        return

    updates = load_input(sys.argv[1])

    data = json.load(open(DATA_FILE, encoding="utf-8"))
    by_id = {p["id"]: p for p in data.get("products", [])}

    updated, unknown, empty = [], [], []
    keyworded = 0
    for item in updates:
        pid = (item or {}).get("id")
        desc = (item or {}).get("description")
        if not pid or desc is None:
            empty.append(item)
            continue
        if pid not in by_id:
            unknown.append(pid)
            continue
        by_id[pid]["description"] = desc.strip()

        # Optional search keywords (see docs/ai-descriptions.md)
        kws = (item or {}).get("keywords")
        if isinstance(kws, str):
            kws = kws.split(",")
        if isinstance(kws, list):
            clean = []
            for raw in kws:
                word = str(raw).strip().lower()
                if word and word not in clean:
                    clean.append(word)
            if clean:
                by_id[pid]["keywords"] = clean
                keyworded += 1

        updated.append(pid)

    if not updated:
        print("Nothing to update.")
        if unknown:
            print("Unknown ids:", ", ".join(unknown))
        return

    # Back up, then write in the admin tool's format (indent=2, ASCII-escaped).
    shutil.copy2(DATA_FILE, DATA_FILE + ".bak")
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)  # matches product_admin.py's save format

    print(f"Updated {len(updated)} description(s): {', '.join(updated)}")
    if keyworded:
        print(f"Set search keywords on {keyworded} product(s)")
    print(f"Backup saved to: {os.path.basename(DATA_FILE)}.bak")
    if unknown:
        print(f"\nSkipped {len(unknown)} unknown id(s): {', '.join(unknown)}")
    if empty:
        print(f"\nSkipped {len(empty)} malformed entr(y/ies) with no id/description.")


if __name__ == "__main__":
    main()
