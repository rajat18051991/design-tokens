import json
from pathlib import Path

def wrap_token_file(input_path, namespace, output_path):
    with open(input_path, "r") as f:
        data = json.load(f)
    wrapped_data = {namespace: data}
    with open(output_path, "w") as f:
        json.dump(wrapped_data, f, indent=2)
    print(f"✅ Wrapped: {input_path} ➜ {output_path}")

def wrap_all_from_manifest(manifest_path, token_dir, output_dir):
    token_dir = Path(token_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    for collection, data in manifest.get("collections", {}).items():
        for mode, files in data["modes"].items():
            for file in files:
                input_path = token_dir / file
                if not input_path.exists():
                    print(f"⚠️ Skipping missing file: {file}")
                    continue
                output_path = output_dir / f"{Path(file).stem}.wrapped.json"
                wrap_token_file(input_path, mode, output_path)

if __name__ == "__main__":
    wrap_all_from_manifest(
        manifest_path="tokens/manifest.json",
        token_dir="tokens",
        output_dir="tokens/wrapped"
    )
