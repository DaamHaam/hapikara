"""Export verified captures and raw measurements into the repository, without retouching."""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = Path('/tmp/hapikara-qa')
dest = root / '.github/screenshots'
dest.mkdir(parents=True, exist_ok=True)
shots = {'P1': 'aerial', 'P2': 'avenue', 'P3': 'canal', 'P4': 'pyramidion', 'P5': 'jardins', 'P6': 'quai', 'oasis': 'oasis', 'palms': 'palmes'}
for src, name in shots.items():
    Image.open(source / 'release-medium' / f'{src}.png').convert('RGB').save(dest / f'{name}.jpg', quality=88, optimize=True)
review = dest / 'review'
review.mkdir(exist_ok=True)
if '--save-instrumented' in sys.argv:
    (review / 'medium-with-timings.json').write_bytes((source / 'release-medium/report.json').read_bytes())
for t in [28, 40, 52]:
    for k in [0, 1]:
        Image.open(source / 'release-medium' / f'fly-{t}-{k}.png').convert('RGB').save(review / f'fly-{t}-{k}.jpg', quality=90, optimize=True)
for level in ['medium', 'high', 'low']:
    report = json.loads((source / f'release-{level}' / 'report.json').read_text())
    (review / f'{level}.json').write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
for name in ['flicker', 'palms-flicker']:
    Image.open(source / 'release-medium' / f'{name}.png').convert('RGB').save(review / f'{name}.jpg', quality=90, optimize=True)
control = source / 'palm-control/report.json'
if control.exists():
    (review / 'palm-control.json').write_bytes(control.read_bytes())
print('Exported 8 review views, 3 consecutive frame pairs, 2 flicker maps and 3 raw reports.')
