"""Build the optional iOS installation icon. No image is loaded by the 3D renderer."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
scale = 4
im = Image.new('RGB', (180 * scale, 180 * scale), '#082e36')
d = ImageDraw.Draw(im)
def poly(points, color):
    d.polygon([(int(x*scale), int(y*scale)) for x,y in points], fill=color)
for x0,y0,x1,y1 in [(28,126,152,140),(40,106,140,126),(53,86,127,106),(66,66,114,86)]:
    poly([(x0,y0),(x1,y0),(x1,y1),(x0,y1)], '#dfbf79')
poly([(90,25),(113,66),(67,66)], '#40b88d')
poly([(90,25),(90,66),(113,66)], '#167757')
d.line([(90*scale,25*scale),(113*scale,66*scale),(67*scale,66*scale),(90*scale,25*scale)],fill='#ffe2a0',width=2*scale)
import math
d.line([(x*scale,round((151-4*math.sin((x-23)*math.pi/40))*scale)) for x in range(23,158)],fill='#40c6b1',width=6*scale)
im.resize((180,180),Image.Resampling.LANCZOS).save(root/'apple-touch-icon.png',optimize=True)
