const KEY='baccarat-quick-v2';
let db;
try{db=JSON.parse(localStorage.getItem(KEY))||{shoes:[{rounds:[]}],active:0}}catch{db={shoes:[{rounds:[]}],active:0}}
if(!Array.isArray(db.shoes)||!db.shoes.length)db={shoes:[{rounds:[]}],active:0};
let chosen=null;
let forecast=null;
const $=id=>document.getElementById(id),s=()=>db.shoes[db.active],persist=()=>{localStorage.setItem(KEY,JSON.stringify(db));render()};
const rankList=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
document.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{chosen=b.dataset.result;document.querySelectorAll('[data-result]').forEach(x=>x.classList.toggle('selected',x===b))});
function cards(v){return v.toUpperCase().split(/[ ,，、]+/).filter(Boolean)}
document.querySelectorAll('[data-rank-target]').forEach(pad=>{
 const input=$(pad.dataset.rankTarget);
 pad.querySelectorAll('[data-rank]').forEach(btn=>btn.addEventListener('click',()=>{
  const values=cards(input.value);
  if(values.length>=3){$('hint').textContent='每位玩家最多輸入三張牌；若已輸入兩張且沒有補牌，請直接保留兩張。';return}
  input.value=(input.value.trim()?input.value.trim()+' ':'')+btn.dataset.rank;
  input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
 }));
});
function valid(a){return a.every(x=>rankList.includes(x))}
function score(a){return a.reduce((n,x)=>n+(x==='A'?1:['10','J','Q','K'].includes(x)?0:+x),0)%10}
function makeRoad(seq){
 const cols=[],beads=[];let last=null,col=-1,row=0;
 const occupied=(x,y)=>!!(cols[x]&&cols[x][y]);
 seq.forEach(result=>{
  if(result==='T'){
   const current=beads[beads.length-1];
   if(current){const cell=cols[current.c][current.r];cell.ties=(cell.ties||0)+1}
   return;
  }
  if(result!==last){
   col++;row=0;
   while(occupied(col,row))col++;
  }else if(row<5&&!occupied(col,row+1))row++;
  else{
   col++;
   while(occupied(col,row))col++;
  }
  if(!cols[col])cols[col]=[];
  const bead={result,c:col,r:row,ties:0};
  cols[col][row]=bead;
  beads.push(bead);
  last=result;
 });
 return {cols,beads};
}
function derivedRoad(big,offset){
 const {cols,beads}=big,signals=[];
 beads.forEach(bead=>{
  const c=bead.c,r=bead.r;
  // 副路起算：眼路可從大路第2欄第2顆開始；
  // 小路第3欄第2顆開始；曱甴路第4欄第2顆開始。
  if(c<offset||(c===offset&&r===0))return;
  let same;
  if(r===0){
   // 新欄首顆：比較前一欄與隔 offset 欄的欄高。
   const near=cols[c-1]||[],far=cols[c-offset-1]||[];
   same=near.filter(Boolean).length===far.filter(Boolean).length;
  }else{
   // 同欄續珠：以距離 offset 的左方格，和該格正上方比較。
   // 兩格同為有珠或同為空格＝紅；一有一空＝藍。
   const compareCol=cols[c-offset]||[];
   same=!!compareCol[r]===!!compareCol[r-1];
  }
  signals.push(same?'B':'P');
 });
 // 副路訊號自身依大路產生先後順序排盤。
 const grid=[],placed=[];let last=null,col=-1,row=0;
 const occupied=(x,y)=>!!(grid[x]&&grid[x][y]);
 signals.forEach(color=>{
  if(last===null){col=0;row=0}
  else if(color===last){
   if(row<5&&!occupied(col,row+1))row++;
   else{col++;while(occupied(col,row))col++}
  }else{
   col++;row=0;while(occupied(col,row))col++;
  }
  if(!grid[col])grid[col]=[];
  grid[col][row]={result:color};
  placed.push({result:color,c:col,r:row});
  last=color;
 });
 return placed;
}
function paintRoad(id,items,large=false){
 const width=12,cells=Array.from({length:6},()=>Array(width).fill(null));
 const maxCol=items.reduce((m,x)=>Math.max(m,x.c||0),0),shift=Math.max(0,maxCol-width+1);
 items.forEach(x=>{const c=(x.c||0)-shift;if(c>=0&&c<width&&x.r>=0&&x.r<6)cells[x.r][c]=x});
 const target=$(id);if(!target)return;
 target.innerHTML=cells.map(row=>row.map(x=>'<div class="road-cell">'+(x?'<span class="road-mark '+x.result+(x.preview?' preview-mark':'')+'">'+(large?(x.result==='B'?'莊':'閒'):'')+(x.ties?'<i>'+x.ties+'</i>':'')+'</span>':'')+'</div>').join('')).join('');
}
function renderRoadBoards(){
 const seq=s().rounds.map(x=>x.result);if(forecast)seq.push(forecast);
 const big=makeRoad(seq),cols=big.cols;
 const lastBead=big.beads[big.beads.length-1];
 paintRoad('bigRoad',big.beads.map(x=>({...x,preview:!!forecast&&x===lastBead})),true);
 [['eyeRoad',1],['smallRoad',2],['roachRoad',3]].forEach(([id,offset])=>{
  const road=derivedRoad(big,offset),last=road.length-1;
  paintRoad(id,road.map((x,i)=>({...x,preview:!!forecast&&i===last})));
 });
 const status=$('setupStatus');if(status)status.textContent='已記錄 '+s().rounds.length+' 局；四種路盤同步更新。';
 const fs=$('forecastStatus');if(fs)fs.textContent=forecast?('預覽中：假設下一局開'+(forecast==='B'?'莊':'閒')+'。閃爍標記為模擬位置，尚未寫入正式紀錄。'):'按下莊問路或閒問路，預覽下一局四種路盤變化；不會寫入正式紀錄。';
}
$('askBanker').onclick=()=>{forecast='B';renderRoadBoards()};
$('askPlayer').onclick=()=>{forecast='P';renderRoadBoards()};
$('clearForecast').onclick=()=>{forecast=null;renderRoadBoards()};
document.querySelectorAll('[data-past]').forEach(b=>b.addEventListener('click',()=>{s().rounds.push({result:b.dataset.past,p:[],b:[],imported:true,at:Date.now()});persist()}));
$('undoRoad').addEventListener('click',()=>{const i=s().rounds.map(x=>x.imported).lastIndexOf(true);if(i>=0){s().rounds.splice(i,1);persist()}});
$('clearRoad').addEventListener('click',()=>{if(confirm('確定清空已輸入的前段路單？')){s().rounds=s().rounds.filter(x=>!x.imported);persist()}});
function saveRound(){
 if(!chosen)return alert('請先點選這局是莊贏、閒贏或和局');
 let p=cards($('pCards').value),b=cards($('bCards').value);
 if(!valid(p)||!valid(b))return alert('牌面請填 A、2–10、J、Q、K，以空格分開');
 if((p.length||b.length)&&(!p.length||!b.length||p.length<2||b.length<2||p.length>3||b.length>3))return alert('牌面請輸入閒家及莊家各 2–3 張；若不知道牌面，兩邊都留空');
 if(p.length&&b.length){
  const expected=score(b)===score(p)?'T':score(b)>score(p)?'B':'P';
  if(expected!==chosen&&!confirm('依照輸入牌面計算結果為「'+({B:'莊贏',P:'閒贏',T:'和局'}[expected])+'」，但你選的是「'+({B:'莊贏',P:'閒贏',T:'和局'}[chosen])+'」。仍要保存嗎？'))return;
 }
 s().rounds.push({result:chosen,p,b,imported:false,at:Date.now()});forecast=null;
 $('pCards').value='';$('bCards').value='';chosen=null;
 document.querySelectorAll('[data-result]').forEach(x=>x.classList.remove('selected'));
 $('hint').textContent='已保存本局；已知牌面會從牌組扣除並重新估算。';persist();
}
$('save').onclick=saveRound;
function seededRandom(seedText){
 let h=2166136261;for(let i=0;i<seedText.length;i++){h^=seedText.charCodeAt(i);h=Math.imul(h,16777619)}
 return function(){h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
}
function shuffle(a,random){for(let i=a.length-1;i>0;i--){let j=random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function simulate(n=16000){
 const rounds=s().rounds,known=rounds.filter(x=>!x.imported&&x.p?.length&&x.b?.length);
 const prior=rounds.filter(x=>x.imported||!x.p?.length||!x.b?.length).length;
 const random=seededRandom(JSON.stringify(rounds.map(x=>({result:x.result,p:x.p||[],b:x.b||[],imported:!!x.imported}))));
 const counts=Object.fromEntries(rankList.map(x=>[x,32]));
 let knownN=0;known.forEach(x=>[...x.p,...x.b].forEach(c=>{counts[c]--;knownN++}));
 if(Object.values(counts).some(x=>x<0))return {error:'牌面扣除數量超過八副牌總數，請檢查是否重複輸入。'};
 const deck=[];rankList.forEach(x=>{for(let i=0;i<counts[x];i++)deck.push(x)});
 const tally={B:0,P:0,T:0,pairP:0,pairB:0};
 const hiddenN=Math.min(deck.length-6,Math.round(prior*4.8));
 for(let k=0;k<n;k++){
  const d=deck.slice();shuffle(d,random);
  for(let i=0;i<hiddenN;i++){const j=random()*(d.length-i)|0;[d[j],d[d.length-1-i]]=[d[d.length-1-i],d[j]]}
  const rem=d.slice(0,d.length-hiddenN);let ix=0;
  const p=[rem[ix++],rem[ix++]],b=[rem[ix++],rem[ix++]];
  if(p[0]===p[1])tally.pairP++;if(b[0]===b[1])tally.pairB++;
  let pv=score(p),bv=score(b);
  if(pv<8&&bv<8){
   let third=null;
   if(pv<=5){third=rem[ix++];p.push(third)}
   if(p.length===3){let v=third==='A'?1:['10','J','Q','K'].includes(third)?0:+third;if(bv<=2||(bv===3&&v!==8)||(bv===4&&v>=2&&v<=7)||(bv===5&&v>=4&&v<=7)||(bv===6&&(v===6||v===7)))b.push(rem[ix++])}
   else if(bv<=5)b.push(rem[ix++]);
  }
  pv=score(p);bv=score(b);tally[pv===bv?'T':bv>pv?'B':'P']++;
 }
 return {probs:Object.fromEntries(Object.entries(tally).map(([k,v])=>[k,v/n])),knownN,hiddenN,prior};
}
function ev(prob,odds){return prob*odds-(1-prob)}
function pct(v){return (v*100).toFixed(2)+'%'}
function render(){
 const rounds=s().rounds,sim=simulate();
 $('rounds').textContent=rounds.length;$('shoeInfo').textContent='中途進房＋已知牌追蹤';renderRoadBoards();
 if(sim.error){$('caveat').textContent=sim.error;return}
 const p=sim.probs;
 $('mainPicks').innerHTML=[['莊勝',p.B],['閒勝',p.P],['和局',p.T]].map(([n,v])=>'<div class="pick"><small>'+n+'</small><b>'+pct(v)+'</b><span>牌靴條件模擬估算</span></div>').join('');
 const bets=[['閒對',p.pairP,11,'閒家前兩張同點數'],['莊對',p.pairB,11,'莊家前兩張同點數'],['和局',p.T,8,'莊閒最終點數相同']];
 $('sidePicks').innerHTML=bets.map(([name,prob,odds,desc])=>{
  const value=ev(prob,odds),threshold=1/(odds+1),margin=2*Math.sqrt(prob*(1-prob)/16000);
  // 未知前段牌面不是單純抽樣誤差；在無法還原實際扣牌前，不顯示可下注的正期望值訊號。
  const reliable=sim.prior===0&&sim.knownN>=40;
  const signal=reliable&&(prob-margin)>threshold;
  return '<div class="side-row"><div><b>'+name+'</b><small>'+desc+'｜賠 '+odds+':1｜損益平衡 '+pct(threshold)+'</small></div><div class="signal-detail"><b>'+pct(prob)+'</b><small>期望值 '+(value>=0?'+':'')+pct(value)+'｜抽樣下界 '+pct(Math.max(0,prob-margin))+'</small><strong class="'+(signal?'signal-on':'signal-off')+'">'+(signal?'模型正期望值訊號':sim.prior?'未知前段牌面，訊號停用':'資料不足，暫不下注')+'</strong></div></div>';
 }).join('');
 const confidence=sim.prior>0?'極低（進房前牌面未知，無法精確扣牌）':sim.knownN>=80?'中（已知牌面較多，仍有抽樣誤差）':sim.knownN>=40?'中低（已知牌面有限）':'低（已知牌面不足）';
 $('caveat').textContent='已知並扣除 '+sim.knownN+' 張進房後牌面。進房前 '+sim.prior+' 局只有結果、沒有牌面；模型以每局平均約 4.8 張作隨機未知牌抽離估算，並非實際扣牌紀錄。';
 $('recommend').textContent='資料可信度：'+confidence+'。期望值為理論值，不等於命中率；目前未建立足夠的逐局預測封存與回測資料，因此不宣稱模型命中率。只要存在未知前段牌面，對子／和局正期望值訊號一律停用，避免把抽樣誤差誤認為真實優勢。';
}
$('clearAllRoad').addEventListener('click',()=>{if(confirm('確定清空本靴全部紀錄？包含前段路單、實際牌面與所有格盤資料。此操作無法復原。')){s().rounds=[];forecast=null;chosen=null;persist();$('pCards').value='';$('bCards').value='';document.querySelectorAll('[data-result]').forEach(x=>x.classList.remove('selected'));$('hint').textContent='本靴全部紀錄已清空。';}});
$('newShoe').onclick=()=>{db.shoes.push({rounds:[]});db.active=db.shoes.length-1;persist()};
$('backup').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='baccarat-records.json';a.click();URL.revokeObjectURL(a.href)};
render();
