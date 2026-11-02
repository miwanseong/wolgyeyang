"""Original cloth sweep, rolling friction and landing thud; no third-party samples."""
import math,random,struct,wave,pathlib
rate=22050;rng=random.Random(812);samples=[];previous=0
for i in range(int(rate*.38)):
 t=i/rate;noise=rng.uniform(-1,1);previous=previous*.68+noise*.32
 cloth=(math.sin(min(1,t/.3)*math.pi)**1.4)*previous*.6
 landing=0
 for at,gain in [(.055,.16),(.17,.12),(.285,.26)]:
  age=t-at
  if age>=0:landing+=gain*math.exp(-age*48)*(math.sin(2*math.pi*105*age)+previous*.6)
 value=(cloth+landing)*min(1,t/.008)*min(1,(.38-t)/.03)
 samples.append(struct.pack('<h',int(max(-.95,min(.95,value))*32767)))
p=pathlib.Path(__file__).resolve().parents[1]/'public/assets/audio/dodge.wav'
with wave.open(str(p),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(b''.join(samples))
