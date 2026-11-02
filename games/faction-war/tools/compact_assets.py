"""One-time lossless image packaging and 96kbps stereo BGM delivery copies.
Original PNG/MP3 sources remain in Git history; never retain duplicate runtime copies.
"""
from pathlib import Path
from PIL import Image,ImageChops
import subprocess,json
root=Path(__file__).resolve().parents[1];out=root/'public/assets';before=sum(p.stat().st_size for p in (root/'public').rglob('*') if p.is_file());images=0
for source in out.glob('*.png'):
 target=source.with_suffix('.webp');original=Image.open(source).convert('RGBA');original.save(target,lossless=True,method=6,exact=True)
 restored=Image.open(target).convert('RGBA')
 # Invisible RGB under zero alpha has no visual meaning; visible RGBA must match.
 difference=ImageChops.difference(original,restored); visible=ImageChops.multiply(difference.convert('RGB'),original.getchannel('A').convert('RGB'))
 if visible.getbbox():raise RuntimeError('pixel mismatch '+str(source))
 source.unlink();images+=1
for source in ([] if (root/'asset-packing.json').exists() else (out/'audio/user').glob('*.mp3')):
 if not(source.name.startswith('bgm_') or source.name.startswith('audiobgm_')):continue
 target=source.with_name(source.stem+'.compact.mp3');subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-map_metadata','-1','-c:a','libmp3lame','-b:a','96k','-ar','44100','-ac','2',str(target)],check=True);target.replace(source)
after=sum(p.stat().st_size for p in (root/'public').rglob('*') if p.is_file());report={'before':before,'after':after,'saved':before-after,'lossless_images':images};(root/'asset-packing.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
