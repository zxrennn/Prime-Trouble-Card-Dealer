const COLORS=['#e8c25a','#3fd0b4','#ff5d7a','#a98bff'];
const SPEC=[[1,6],[2,6],[3,5],[4,5],[5,4],[6,4],[-1,5],[-2,4],[-3,3],[-5,2]];
const PRIMES=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59],DANGER=[9,18,27,36,45,54];
const KEY='primeTroubleV1';
/* ---------- game logic (pure) ---------- */
function buildDeck(){let id=0,d=[];for(const[v,n]of SPEC)for(let i=0;i<n;i++)d.push({id:id++,t:'m',v});
 for(let i=0;i<3;i++)d.push({id:id++,t:'p'});for(let i=0;i<3;i++)d.push({id:id++,t:'i'});return d}
function shuffle(a){a=a.slice();const r=new Uint32Array(1);for(let i=a.length-1;i>0;i--){let j;const lim=Math.floor(4294967296/(i+1))*(i+1);do{crypto.getRandomValues(r)}while(r[0]>=lim);j=r[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function total(g){return g.draw.length+g.discard.length+g.players.reduce((s,p)=>s+p.hand.length,0)}
function drawOne(g){if(!g.draw.length){if(!g.discard.length)return null;g.draw=shuffle(g.discard);g.discard=[]}return g.draw.pop()}
function nextPrime(n){return PRIMES.find(p=>p>n)||null}
function isPos(c){return c.t==='m'&&c.v>0}
function newGame(names){const g={players:names.map((n,i)=>({name:n,color:COLORS[i],hand:[],tokens:[1,1],done:false})),draw:shuffle(buildDeck()),discard:[],cur:0,turn:1,status:'playing',tracking:false};
 for(let r=0;r<3;r++)g.players.forEach(p=>p.hand.push(drawOne(g)));
 g.cur=Math.floor(Math.random()*names.length);return g}
function playCards(g,pi,ids){const p=g.players[pi];const cs=ids.map(i=>p.hand.find(c=>c.id===i));
 if(cs.some(c=>!c)||new Set(ids).size!==ids.length)return false;
 if(cs.length===2&&!(cs.some(c=>c.t==='i')&&cs.some(isPos)))return false;
 if(cs.length===1&&cs[0].t==='i')return false;
 p.hand=p.hand.filter(c=>!ids.includes(c.id));g.discard.push(...cs);
 while(p.hand.length<3){const c=drawOne(g);if(!c)break;p.hand.push(c)}return true}
function advance(g){const n=g.players.length;for(let i=1;i<=n;i++){const k=(g.cur+i)%n;if(!g.players[k].done){g.cur=k;break}}g.turn++}
function selfTest(){const d=buildDeck(),c={};d.forEach(x=>{const k=x.t==='m'?x.v:x.t;c[k]=(c[k]||0)+1});
 const exp={1:6,2:6,3:5,4:5,5:4,6:4,'-1':5,'-2':4,'-3':3,'-5':2,p:3,i:3};
 return d.length===50&&Object.keys(exp).every(k=>c[k]===exp[k])&&new Set(d.map(x=>x.id)).size===50}
/* ---------- board ---------- */
// BOARD TEMPLATE: set BOARD_IMG to your artwork (a data: URI or an https image) once the physical board design is final.
// The 60-square grid is then drawn as a transparent overlay on top of it.
const BOARD_IMG='';
function computeMove(g,pi,ids,ti){const p=g.players[pi],cs=ids.map(i=>p.hand.find(c=>c.id===i)),from=p.tokens[ti];
 if(from>=60)return{ok:false,reason:'That token is already Home.'};
 let to,note='';
 if(cs[0].t==='p'){const np=nextPrime(from);if(!np)return{ok:false,reason:'No prime ahead before 60.'};to=np;note='Prime Scan';if(np+5<=60){to=np+5;note+=' +5 boost'}}
 else{const m=cs.find(c=>c.t==='m'),d=cs.length===2?-m.v:m.v;to=from+d;
  if(to>60)return{ok:false,reason:'Overshoots 60 — illegal.'};if(to<1)to=1;
  if(PRIMES.includes(to)){if(to+5<=60){note='Prime +5';to+=5}}else if(DANGER.includes(to)){note='Danger −3';to=Math.max(1,to-3)}}
 const bump=[];if(to>1&&to<60)g.players.forEach((q,j)=>{if(j!==pi)q.tokens.forEach((t,k)=>{if(t===to)bump.push([j,k])})});
 return{ok:true,from,to,note,bump}}
function applyMove(g,pi,ti,mv){g.players[pi].tokens[ti]=mv.to;mv.bump.forEach(([j,k])=>g.players[j].tokens[k]=1)}
function moveLabel(cs){if(cs.length===2){const m=cs.find(isPos);return `Invert + +${m.v} = −${m.v}`}const c=cs[0];return c.t==='p'?'Prime Scan':(c.v>0?'+':'−')+Math.abs(c.v)}
function boardHTML(mv){let cells=[];for(let r=5;r>=0;r--){const row=[...Array(10)].map((_,i)=>r*10+i+1);if(r%2)row.reverse();cells.push(...row)}
 const at={};if(G.tracking)G.players.forEach(p=>p.tokens.forEach((t,j)=>(at[t]=at[t]||[]).push(`<i class="tk" style="background:${p.color}">${'AB'[j]}</i>`)));
 const sq=cells.map(n=>`<div class="sq ${PRIMES.includes(n)?'p':''} ${DANGER.includes(n)?'d':''} ${n===60?'h':''} ${mv&&mv.to===n?'to':''} ${mv&&mv.from===n?'from':''}"><small>${n===60?'⌂ 60':n}</small>${(at[n]||[]).join('')}</div>`).join('');
 return `<div class="board" ${BOARD_IMG?`style="background-image:url('${BOARD_IMG}')"`:''}>${sq}</div><div class="stat">${BOARD_IMG?'':'BOARD TEMPLATE · ARTWORK SLOT · '}<span style="color:var(--pos)">PRIME</span> · <span style="color:var(--neg)">DANGER</span> · <span style="color:var(--gold)">HOME</span>${G.tracking?'':' · ENABLE TRACKING TO SEE TOKENS'}</div>`}
function boardScreen(){const L=S.viewOnly?null:G.last;let head='';
 if(L){const p=G.players[L.pi],m=L.mv;head=`<div class="sub" style="color:${p.color}">${esc(p.name).toUpperCase()} PLAYED ${L.label}</div>`+(L.fx||[]).map(f=>`<div class="fx" style="color:var(--${f[1]})">${f[0]}</div>`).join('')+`<div class="hint">${m?`Token ${'AB'[m.ti]}: ${m.from} → <b>${m.to}</b>`:'Make this move on your physical board.'}</div>`}
 const race=G.tracking?`<div class="race">${G.players.map(p=>`<div class="rc"><span class="dot" style="background:${p.color}"></span><div class="rb"><i style="width:${Math.round((p.tokens.reduce((a,b)=>a+b,0)-2)/118*100)}%;background:${p.color}"></i></div></div>`).join('')}</div>`:'';
 const nx=G.players[G.cur];return `<div class="center" style="justify-content:flex-start;gap:10px">${head}${boardHTML(L&&L.mv)}${race}<button class="btn pri big" data-act="next">${S.viewOnly?'Close':'Done · pass to '+esc(nx.name)}</button></div>`}
function tokPick(){if(!G.tracking||!valid())return'';const p=cur(),t=S.tok||0,mv=computeMove(G,G.cur,S.sel,t);
 return `<div class="seg" style="width:min(360px,100%)">${p.tokens.map((x,i)=>`<button class="${t===i?'on':''}" data-act="tok" data-t="${i}">${'AB'[i]} · ${x}</button>`).join('')}</div><div class="msg">${mv.ok?`${mv.from} → ${mv.to}${mv.note?' · '+mv.note:''}`:'⚠ '+mv.reason}</div>`}
function movePreview(){return G.tracking?computeMove(G,G.cur,S.sel,S.tok||0):{ok:true}}
/* ---------- feedback ---------- */
let AC=null,MUTE=false;
function sfx(k){try{if(navigator.vibrate)navigator.vibrate(k==='neg'?[30,40,30]:15);if(MUTE)return;AC=AC||new(window.AudioContext||window.webkitAudioContext)();
 const f={pos:[660,880,1100],gold:[523,659,784,1047],neg:[220,165],tap:[440],play:[520,700]}[k]||[440];
 f.forEach((hz,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.09;o.frequency.value=hz;o.type=k==='neg'?'sawtooth':'sine';
 g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.3)})}catch(e){}}
function hintLine(){if(!S.sel.length)return'Tap a card';const p=cur(),cs=S.sel.map(i=>p.hand.find(c=>c.id===i));
 if(cs.length===2){const m=cs.find(isPos);return `Invert flips +${m.v} to −${m.v}`}const c=cs[0];
 if(c.t==='i')return'Now tap a positive card';if(c.t==='p')return'Jump to the next prime, then +5';return c.v>0?`Move forward ${c.v}`:`Move back ${-c.v}`}
/* ---------- state ---------- */
let G=null,S={screen:'home',phase:'privacy',sel:[],msg:'',setup:{n:2,track:true,names:['','','','']},busy:false,confirmDone:false};
function save(){try{localStorage.setItem(KEY,JSON.stringify(G))}catch(e){}}
function load(){try{const s=localStorage.getItem(KEY);if(s){const g=JSON.parse(s);if(g&&g.players&&total(g)===50)return g}}catch(e){}return null}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cur=()=>G.players[G.cur];
function cardHTML(c,sel,dis){let col,v,l,t;
 if(c.t==='m'){col=c.v>0?'var(--pos)':'var(--neg)';v=(c.v>0?'+':'−')+Math.abs(c.v);l=c.v>0?'INTEGER<br>FORWARD':'INTEGER<br>BACKWARD';t=c.v>0?'▲':'▼'}
 else if(c.t==='p'){col='var(--gold)';v='P?';l='PRIME SCAN<br>NEXT PRIME +5';t='∴'}
 else{col='var(--wild)';v='±';l='INVERT<br>FLIP A POSITIVE';t='⇄'}
 return `<div class="card ${sel?'sel':''} ${dis?'dis':''}" style="--c:${col}" data-act="pick" data-id="${c.id}"><span class="t">${t}</span><div class="v">${v}</div><div class="l">${l}</div></div>`}
function describe(ids){const p=cur(),cs=ids.map(i=>p.hand.find(c=>c.id===i));
 if(cs.length===2){const m=cs.find(isPos);return {title:`Invert + +${m.v} → −${m.v}`,body:`Move one token back ${m.v} squares. Both cards are discarded and you draw two replacements.`}}
 const c=cs[0];if(c.t==='p')return{title:'Prime Scan',body:'Move one token straight to the next Prime ahead, then take the +5 Prime Boost. Not allowed if no prime lies ahead before 60.'+(G.tracking?'<br><br>'+p.tokens.map((t,i)=>`Token ${'AB'[i]} on ${t}: `+(t>=60?'in Home':nextPrime(t)?'next prime '+nextPrime(t)+' → '+(nextPrime(t)+5):'no prime ahead')).join('<br>'):'')}
 return{title:`You selected ${c.v>0?'+':'−'}${Math.abs(c.v)}`,body:(c.v>0?'Move forward ':'Move back ')+Math.abs(c.v)+' squares. Remember: reaching beyond 60 is illegal — Home needs exactly 60.'}}
/* ---------- views ---------- */
function view(){const a=document.getElementById('app');a.innerHTML=({home,setup,rules,about,game,end})[S.screen]();}
function home(){return `<div class="center"><div class="sub">∑ ∏ ∫ π</div><h1 class="logo">PRIME<b>·</b>TROUBLE</h1><div class="sub">THE MATHEMATICAL STRATEGY GAME</div><div class="stack" style="margin-top:24px">${G&&G.status==='playing'?'<button class="btn pri big" data-act="resume">Continue</button><button class="btn" data-act="go" data-to="setup">New game</button>':'<button class="btn pri big" data-act="go" data-to="setup">Play</button>'}<div class="row"><button class="link" data-act="go" data-to="rules">how to play</button><button class="link" data-act="go" data-to="about">about</button></div></div></div>`}
function setup(){const s=S.setup;let rows='';for(let i=0;i<s.n;i++)rows+=`<div class="prow"><span class="dot" style="background:${COLORS[i]}"></span><input type="text" maxlength="14" placeholder="Player ${i+1}" value="${esc(s.names[i])}" data-name="${i}"></div>`;
 return `<div class="center"><h2 class="big">New Game</h2><div class="panel"><div class="sub" style="margin-bottom:10px">PLAYERS</div><div class="seg">${[2,3,4].map(n=>`<button class="${s.n===n?'on':''}" data-act="n" data-n="${n}">${n}</button>`).join('')}</div>${rows}
<label class="prow" style="color:var(--mute);font-size:14px"><input type="checkbox" id="trk" ${s.track?'checked':''} style="width:20px;height:20px"> Show tokens on the board</label></div>
<button class="btn pri big" data-act="start">Start</button><button class="link" data-act="go" data-to="home">back</button></div>`}
function rules(){return `<div class="center" style="justify-content:flex-start"><h2 class="big">Quick Reference</h2><div class="panel">
<div class="rule"><b>PRIME</b><span>Land exactly on a prime → +5</span></div><div class="rule"><b>DANGER</b><span>Land exactly on a multiple of 9 → −3</span></div>
<div class="rule"><b>BUMP</b><span>Land on an opponent → they return to square 1</span></div><div class="rule"><b>HOME</b><span>Reach exactly 60. Overshooting is illegal; no bouncing. Home tokens can't be moved or bumped.</span></div>
<div class="rule"><b>NO CHAIN</b><span>Effects never trigger further effects.</span></div><div class="rule"><b>SCAN</b><span>Prime Scan: jump to next prime ahead, then +5.</span></div>
<div class="rule"><b>INVERT</b><span>Pair with a positive card to make it negative; both discarded, draw two.</span></div>
<p style="margin:14px 0 4px" class="sub">PRIMES</p>${PRIMES.map(p=>`<span class="tag p">${p}</span>`).join('')}<p style="margin:14px 0 4px" class="sub">DANGER</p>${DANGER.map(p=>`<span class="tag d">${p}</span>`).join('')}</div>
<button class="btn" data-act="back">Back</button></div>`}
function about(){return `<div class="center"><h2 class="big">About</h2><div class="panel hint">A companion for the physical Prime Trouble board. It shuffles the 50-card deck, deals private hands and passes turns — the board and tokens stay on the table.<br><br>Deck integrity check: <b style="color:var(--pos)">${selfTest()?'✓ 50 cards verified':'✗ failed'}</b></div><button class="btn" data-act="back">Back</button></div>`}
function bar(){return `<div class="bar"><div class="players">${G.players.map((p,i)=>`<span class="chip ${i===G.cur?'cur':''} ${p.done?'done':''}"><span class="dot" style="background:${p.color};width:12px;height:12px"></span>${i===G.cur?esc(p.name):''}</span>`).join('')}</div>
<div class="stat">TURN <b>${G.turn}</b> · DECK <b>${G.draw.length}</b> · DISCARD <b>${G.discard.length}</b></div><div class="row"><button class="btn sm" data-act="endgame">${S.askK==='end'?'Tap again to end':'End game'}</button><button class="btn sm" data-act="mute">${MUTE?'🔇':'🔊'}</button><button class="btn sm" data-act="menu">☰</button></div></div>`}
function game(){const p=cur(),ph=S.phase;let b='';
 if(ph==='privacy')b=`<div class="center"><div class="sub">PASS THE DEVICE TO</div><div class="pname" style="color:${p.color}">${esc(p.name).toUpperCase()}</div><button class="btn pri big" data-act="reveal">Tap to reveal</button><button class="link" data-act="viewboard">view board</button></div>`;
 else if(ph==='hand'){b=`<div class="center"><div class="sub" style="color:${p.color}">${esc(p.name).toUpperCase()} · PICK A CARD</div><div class="hand">${p.hand.map(c=>cardHTML(c,S.sel.includes(c.id),false)).join('')}</div>
<div class="msg">${S.msg||hintLine()}</div>${tokPick()}<button class="btn pri big" data-act="play" ${valid()&&movePreview().ok?'':'disabled'}>Play</button>
${S.more?`<div class="row"><button class="btn sm" data-act="stuck">No legal move</button><button class="btn sm" data-act="finish">${S.askK==='fin'?'Tap again to confirm':'Both tokens Home'}</button><button class="btn sm" data-act="hide">Hide cards</button></div>`:'<button class="link" data-act="more">⋯ more</button>'}</div>`}
 else if(ph==='board')b=boardScreen();
 else if(ph==='stuck')b=`<div class="center"><div class="sub">NO LEGAL MOVE</div><h2 class="big">Choose a card to discard</h2><div class="hand">${p.hand.map(c=>cardHTML(c,S.sel.includes(c.id))).join('')}</div><div class="row"><button class="btn" data-act="cancel">Back</button><button class="btn pri" data-act="swap" ${S.sel.length===1?'':'disabled'}>Discard &amp; Draw</button></div></div>`;
 return bar()+b}
function ask(k){if(S.askK===k){S.askK=null;return true}S.askK=k;setTimeout(()=>{if(S.askK===k){S.askK=null;view()}},3000);return false}
function end(){const act=G.players.filter(p=>!p.done).length,w=G.players.find(p=>p.won),sc=p=>p.tokens.reduce((a,b)=>a+b,0);
 const list=[...G.players].sort((a,b)=>(b.won?1:0)-(a.won?1:0)||sc(b)-sc(a));
 const head=w?`<div class="lock">♛</div><div class="sub">WINNER</div><div class="pname" style="color:${w.color}">${esc(w.name).toUpperCase()}</div>`:`<div class="lock">⌗</div><div class="sub">GAME ENDED</div><h2 class="big">Final standings</h2>`;
 const rows=G.tracking?`<div class="panel">${list.map(p=>`<div class="rc" style="padding:6px 0"><span class="dot" style="background:${p.color}"></span><b style="flex:1;text-align:left">${esc(p.name)}</b><span class="stat">${p.won?'BOTH HOME':'A '+p.tokens[0]+' · B '+p.tokens[1]}</span></div>`).join('')}</div>`:'';
 return `<div class="center">${head}${rows}<div class="row">${act>=2?'<button class="btn" data-act="keep">Keep Playing</button>':''}<button class="btn pri" data-act="go" data-to="setup">New Game</button><button class="btn" data-act="go" data-to="home" data-clear="1">Main Menu</button></div></div>`}
function valid(){const p=cur(),cs=S.sel.map(i=>p.hand.find(c=>c.id===i));
 if(cs.length===1)return cs[0].t!=='i';if(cs.length===2)return cs.some(c=>c.t==='i')&&cs.some(isPos);return false}
/* ---------- events ---------- */
const app=document.getElementById('app');
app.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.name!==undefined)S.setup.names[+t.dataset.name]=t.value;
 if(t.id==='trk')S.setup.track=t.checked;
 if(t.dataset.tok!==undefined){const v=Math.max(1,Math.min(60,parseInt(t.value)||1));cur().tokens[+t.dataset.tok]=v;save()}});
app.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||S.busy)return;const a=el.dataset.act;
 S.busy=true;setTimeout(()=>S.busy=false,250);
 const p=G&&G.players[G.cur];
 if(a==='go'){if(el.dataset.clear){G=null;try{localStorage.removeItem(KEY)}catch(x){}}S.screen=el.dataset.to}
 else if(a==='back')S.screen='home';
 else if(a==='resume'){S.screen='game';S.phase='privacy';S.sel=[]}
 else if(a==='n')S.setup.n=+el.dataset.n;
 else if(a==='start'){const s=S.setup;const names=[...Array(s.n)].map((_,i)=>(s.names[i]||'').trim()||'Player '+(i+1));
  G=newGame(names);G.tracking=!!s.track;save();S.screen='game';S.phase='privacy';S.sel=[];S.msg=''}
 else if(a==='menu'){S.phase='privacy';S.sel=[];S.screen='home'}
 else if(a==='reveal'){sfx('tap');S.phase='hand';S.sel=[];S.msg='';S.more=false;S.tok=cur().tokens[0]>=60?1:0}
 else if(a==='more'){S.more=true}
 else if(a==='mute'){MUTE=!MUTE}
 else if(a==='hide'){S.phase='privacy';S.sel=[]}
 else if(a==='pick'){sfx('tap');const id=+el.dataset.id,c=p.hand.find(x=>x.id===id);if(!c)return;S.msg='';
  if(S.phase==='stuck')S.sel=[id];
  else if(S.sel.includes(id))S.sel=S.sel.filter(x=>x!==id);
  else if(c.t==='i'){if(!p.hand.some(isPos)){S.msg='Invert needs a positive card in your hand.';el.classList.add('shake')}
   else{const pos=S.sel.find(i=>isPos(p.hand.find(x=>x.id===i)));S.sel=pos!==undefined?[id,pos]:[id];if(pos===undefined)S.msg='Now choose a positive card to flip.'}}
  else if(isPos(c)&&S.sel.some(i=>p.hand.find(x=>x.id===i).t==='i'))S.sel=[S.sel.find(i=>p.hand.find(x=>x.id===i).t==='i'),id];
  else S.sel=[id];}
 
 else if(a==='cancel'){S.phase='hand';S.sel=[]}
 else if(a==='play'){if(S.phase!=='hand'||!valid())return;
  const pi=G.cur,ids=S.sel.slice(),ti=S.tok||0,cs=ids.map(i=>cur().hand.find(c=>c.id===i));
  let mv=null;if(G.tracking){mv=computeMove(G,pi,ids,ti);if(!mv.ok)return}
  const label=moveLabel(cs),fx=[];if(mv){if(/Prime/.test(mv.note))fx.push(['PRIME +5','pos']);if(/Danger/.test(mv.note))fx.push(['DANGER −3','neg']);if(mv.bump.length)fx.push(['BUMPED!','neg']);if(mv.to===60)fx.push(['HOME!','gold'])}
  if(playCards(G,pi,ids)){if(mv)applyMove(G,pi,ti,mv);
   G.last={pi,label,fx,mv:mv&&{ti,from:mv.from,to:mv.to,note:mv.note,bump:mv.bump}};advance(G);S.sel=[];S.tok=0;S.viewOnly=false;S.phase='board';save();sfx(fx.length?fx[0][1]:'play')}}
 else if(a==='stuck'){S.phase='stuck';S.sel=[]}
 else if(a==='swap'){if(S.sel.length!==1)return;const id=S.sel[0],card=p.hand.find(c=>c.id===id);if(!card)return;
  p.hand=p.hand.filter(c=>c.id!==id);G.discard.push(card);const n=drawOne(G);if(n)p.hand.push(n);
  S.sel=[];S.phase='hand';S.msg='Card swapped.';save()}
 else if(a==='tok'){S.tok=+el.dataset.t}
 else if(a==='viewboard'){S.viewOnly=true;S.phase='board'}
 else if(a==='next'){S.viewOnly=false;S.phase='privacy'}
 else if(a==='endgame'){if(!ask('end')){view();return}G.status='ended';S.phase='privacy';S.sel=[];save();S.screen='end'}
 else if(a==='finish'){if(!ask('fin')){view();return}p.done=true;p.won=true;p.tokens=[60,60];
  G.discard.push(...p.hand);p.hand=[];G.status='ended';save();S.screen='end'}
 else if(a==='keep'){G.status='playing';S.screen='game';S.phase='privacy';if(cur().done)advance(G);save()}
 view();});
view();
