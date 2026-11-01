"""Original procedural game audio; no external samples. Regenerate with Python 3."""
import math,random,wave,struct,pathlib
RATE=22050;out=pathlib.Path(__file__).resolve().parents[1]/'public/assets/audio';out.mkdir(parents=True,exist_ok=True)
def write(name,duration,fn):
 n=int(RATE*duration);values=[max(-.95,min(.95,fn(i/RATE,i,n))) for i in range(n)]
 with wave.open(str(out/(name+'.wav')),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(b''.join(struct.pack('<h',int(v*32767)) for v in values))
rng=random.Random(7631);noise=[rng.uniform(-1,1) for _ in range(RATE*8)]
def env(t,d):return min(1,t/.006)*max(0,1-t/d)**2
write('swing',.22,lambda t,i,n:env(t,.22)*(.18*noise[i]+.16*math.sin(2*math.pi*(180*t-280*t*t))))
write('impact',.28,lambda t,i,n:env(t,.28)*(.35*math.sin(2*math.pi*(95*t-60*t*t))+.18*noise[i]*math.exp(-t*30)))
write('cast',.6,lambda t,i,n:env(t,.6)*(.18*math.sin(2*math.pi*(300*t+440*t*t))+.07*math.sin(2*math.pi*880*t)))
write('dodge',.24,lambda t,i,n:env(t,.24)*(.14*noise[i]+.09*math.sin(2*math.pi*240*t)))
write('step',.1,lambda t,i,n:env(t,.1)*(.09*noise[i]+.04*math.sin(2*math.pi*105*t)))
write('collect',.35,lambda t,i,n:env(t,.35)*(.12*math.sin(2*math.pi*660*t)+.08*math.sin(2*math.pi*990*t)))
write('forge',.45,lambda t,i,n:env(t,.45)*sum(a*math.sin(2*math.pi*f*t)*math.exp(-t*d) for f,a,d in [(740,.12,5),(1227,.08,12),(1781,.04,15)]))
write('water',.5,lambda t,i,n:env(t,.5)*(.08*math.sin(2*math.pi*(400*t+80*math.sin(t*13)))+.08*noise[i]))
write('levelup',1,lambda t,i,n:env(t,1)*sum(.06*math.sin(2*math.pi*f*t) for f in [330,440,550,660]))
write('perfect',.7,lambda t,i,n:env(t,.7)*(.14*math.sin(2*math.pi*110*t)+.1*math.sin(2*math.pi*(660*t-220*t*t))))
write('charge_loop',1,lambda t,i,n:(.08*math.sin(2*math.pi*110*t)+.045*math.sin(2*math.pi*220*t))*(.8+.2*math.cos(2*math.pi*2*t)))
# Integer cycle counts over 8 seconds make the ambient bed phase-continuous.
write('ambience_loop',8,lambda t,i,n:sum(a*math.sin(2*math.pi*f*t+.3) for f,a in [(55,.04),(82.5,.025),(110,.015),(165,.01)])*(.85+.15*math.cos(2*math.pi*t/8)))
filtered=[sum(noise[(i-j)%len(noise)] for j in range(12))/12 for i in range(len(noise))]
write('rain_loop',8,lambda t,i,n:filtered[i]*.13)
write('step_snow',.16,lambda t,i,n:env(t,.16)*(.065*noise[i]+.04*math.sin(2*math.pi*75*t))*math.exp(-t*6))
write('step_mud',.18,lambda t,i,n:env(t,.18)*(.05*noise[i]+.055*math.sin(2*math.pi*(90*t-35*t*t))))
write('underwater_loop',8,lambda t,i,n:sum(a*math.sin(2*math.pi*f*t) for f,a in [(36,.045),(54,.025),(72,.015)])*(.8+.2*math.cos(2*math.pi*t/8)))
