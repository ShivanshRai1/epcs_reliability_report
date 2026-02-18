from pathlib import Path
import shutil
import pytesseract
from PIL import Image

root = Path(r"c:\Users\Dragon Byte\Downloads\report")
shots_dir = root / "Screenshots"
output_path = root / "ocr_results.txt"

exe = shutil.which("tesseract")
if exe:
    pytesseract.pytesseract.tesseract_cmd = exe
else:
    # Fallback default install path for Windows
    fallback = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    if fallback.exists():
        pytesseract.pytesseract.tesseract_cmd = str(fallback)

images = sorted(shots_dir.glob("*.png"))

lines = []
for image_path in images:
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
    except Exception as exc:
        text = f"[OCR ERROR] {exc}"
    lines.append(f"===== {image_path.name} =====")
    lines.append(text.rstrip())
    lines.append("")

output_path.write_text("\n".join(lines), encoding="utf-8")

print(f"OCR complete. Wrote {output_path} with {len(images)} sections.")
