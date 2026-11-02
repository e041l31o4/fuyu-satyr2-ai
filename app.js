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
function valid(a){return a.every(x=>rankList.includes(x))}
function score(a){return a.reduce((n,x)=>n+(x==='A'?1:['10','J','Q','K'].includes(x)?0:+x),0)%10}
function makeRoad(seq){
 const cols=[];let last=null,col=-1,row=0;
 seq.forEach(result=>{
  if(result==='T'){if(col>=0&&cols[col]&&cols[col][row])cols[col][row].ties=(cols[col][row].ties||0)+1;return}
  if(result!==last){col++;row=0;if(!cols[col])cols[col]=[]}
  else if(row<5&&!cols[col][row+1])row++;
  else{col++;if(!cols[col])cols[col]=[]}
  cols[col][row]={result,ties:0};last=result;
 });
 return cols;
}
function derivedRoad(cols,offset){
 // 依大路實際座標逐顆產生副路訊號，再按副路自己的落點規則排盤。
 const signals=[];
 for(let c=offset+1;c<cols.length;c++){
  const column=cols[c]||[];
  for(let row=0;row<6;row++){
   if(!column[row])continue;
   let same;
   if(row===0){
    const leftA=(cols[c-1]||[]).filter(Boolean).length;
    const leftB=(cols[c-offset-1]||[]).filter(Boolean).length;
    same=leftA===leftB;
   }else{
    same=!!(cols[c-1]||[])[row]===!!(cols[c-offset-1]||[])[row];
   }
   signals.push(same?'B':'P');
  }
 }
 // 副路獨立排盤：同色向下，遇到底部或阻擋則向右；
 // 轉色時開新欄，若頂格被占用則向右尋找空位。
 const grid=[],placed=[];let last=null,col=-1,row=0;
 const occupied=(c,r)=>!!(grid[c]&&grid[c][r]);
 signals.forEach(color=>{
  if(color!==last){
   col=Math.max(0,col+1);row=0;
   while(occupied(col,row))col++;
  }else if(row<5&&!occupied(col,row+1)){
   row++;
  }else{
   col++;
   while(occupied(col,row))col++;
  }
  if(!grid[col])grid[col]=[];
  grid[col][row]={result:color};
  placed.push({result:color,c:col,r:row});
  last=color;
 });
 return placed;
}
function paintRoad(id,items,large=false,preview=false){
 const width=12, cells=Array.from({length:6},()=>Array(width).fill(null));
 if(large){
  items.forEach(x=>{const c=x.c-(Math.max(0,Math.max(...items.map(y=>y.c||0))-width+1));if(c>=0&&c<width)cells[x.r][c]=x});
 }else{
  const maxCol=items.reduce((m,x)=>Math.max(m,x.c||0),0);
  const shift=Math.max(0,maxCol-width+1);
  items.forEach(x=>{const c=(x.c||0)-shift;if(c>=0&&c<width&&x.r>=0&&x.r<6)cells[x.r][c]=x});
 }
 const target=$(id);if(!target)return;
 target.innerHTML=cells.map(row=>row.map(x=>'<div class="road-cell">'+(x?'<span class="road-mark '+x.result+(x.preview?' preview-mark':'')+'">'+(large?(x.result==='B'?'莊':'閒'):'')+(x.ties?'<i>'+x.ties+'</i>':'')+'</span>':'')+'</div>').join('')).join('');
}
function renderRoadBoards(){
 const seq=s().rounds.map(x=>x.result);if(forecast)seq.push(forecast);const cols=makeRoad(seq),big=[];
 cols.forEach((column,c)=>column.forEach((x,r)=>{if(x)big.push({...x,c,r,preview:!!forecast&&c===cols.length-1&&r===(column.length-1)})}));
 paintRoad('bigRoad',big,true,!!forecast);
 paintRoad('eyeRoad',derivedRoad(cols,1).map((x,i)=>({...x,preview:!!forecast&&i===derivedRoad(cols,1).length-1})));
 paintRoad('smallRoad',derivedRoad(cols,2).map((x,i)=>({...x,preview:!!forecast&&i===derivedRoad(cols,2).length-1})));
 paintRoad('roachRoad',derivedRoad(cols,3).map((x,i)=>({...x,preview:!!forecast&&i===derivedRoad(cols,3).length-1})));
 const status=$('setupStatus');if(status)status.textContent='已記錄 '+s().rounds.length+' 局；四種路盤同步更新。';
 const fs=$('forecastStatus');if(fs)fs.textContent=forecast?('預覽中：假設下一局開'+(forecast==='B'?'莊':'閒')+'。閃爍標記為模擬位置，尚未寫入正式紀錄。'):'按下莊問路或閒問路，預覽下一局四種路盤變化；不會寫入正式紀錄。';
}
$('askBanker').onclick=()=>{forecast='B';renderRoadBoards()};
$('askPlayer').onclick=()=>{forecast='P';renderRoadBoards()};
$('clearForecast').onclick=()=>{forecast=null;renderRoadBoards()};
document.querySelectorAll('[data-past]').forEach(b=>b.addEventListener('click',()=>{
 s().rounds.push({result:b.dataset.past,p:[],b:[],imported:true,at:Date.now()});persist();
}));
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
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function simulate(n=16000){
 const rounds=s().rounds,known=rounds.filter(x=>!x.imported&&x.p?.length&&x.b?.length);
 const prior=rounds.filter(x=>x.imported||!x.p?.length||!x.b?.length).length;
 const counts=Object.fromEntries(rankList.map(x=>[x,32]));
 let knownN=0;
 known.forEach(x=>[...x.p,...x.b].forEach(c=>{counts[c]--;knownN++}));
 let invalid=Object.values(counts).some(x=>x<0);
 if(invalid)return {error:'牌面扣除數量超過八副牌總數，請檢查是否重複輸入。'};
 const deck=[];rankList.forEach(x=>{for(let i=0;i<counts[x];i++)deck.push(x)});
 const tally={B:0,P:0,T:0,pairP:0,pairB:0};
 // 舊路單只用來估計未知已發牌張數；每局按平均約 4.8 張隨機抽離，不能視為真實牌面。
 const hiddenN=Math.min(deck.length-6,Math.round(prior*4.8));
 for(let k=0;k<n;k++){
  const d=deck.slice();shuffle(d);
  // 模擬中途進房前未知牌已隨機離開牌靴
  for(let i=0;i<hiddenN;i++){const j=Math.random()*(d.length-i)|0;[d[j],d[d.length-1-i]]=[d[d.length-1-i],d[j]]}
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
 const rounds=s().rounds,sim=simulate(),r=rounds;
 $('rounds').textContent=r.length;$('shoeInfo').textContent='中途進房＋已知牌追蹤';
 renderRoadBoards();
 if(sim.error){$('caveat').textContent=sim.error;return}
 const p=sim.probs;
 $('mainPicks').innerHTML=[['莊勝',p.B],['閒勝',p.P],['和局',p.T]].map(([n,v])=>'<div class="pick"><small>'+n+'</small><b>'+pct(v)+'</b><span>牌靴條件模擬估算</span></div>').join('');
 const bets=[['閒對',p.pairP,11,'閒家前兩張同點數'],['莊對',p.pairB,11,'莊家前兩張同點數'],['和局',p.T,8,'莊閒最終點數相同']];
 $('sidePicks').innerHTML=bets.map(([name,prob,odds,desc])=>{
  const value=ev(prob,odds),threshold=1/(odds+1),margin=2*Math.sqrt(prob*(1-prob)/16000),signal=(prob-margin)>threshold;
  return '<div class="side-row"><div><b>'+name+'</b><small>'+desc+'｜賠 '+odds+':1｜損益平衡 '+pct(threshold)+'</small></div><div class="signal-detail"><b>'+pct(prob)+'</b><small>期望值 '+(value>=0?'+':'')+pct(value)+'｜保守下界 '+pct(Math.max(0,prob-margin))+'</small><strong class="'+(signal?'signal-on':'signal-off')+'">'+(signal?'模型正期望值訊號':'暫不下注')+'</strong></div></div>';
 }).join('');
 const hasRoad=sim.prior>0,hasKnown=sim.knownN>0;
 $('caveat').textContent='目前已知並扣除 '+sim.knownN+' 張進房後牌面。進房前 '+sim.prior+' 局只有結果、沒有牌面；模型以每局平均約 4.8 張作隨機未知牌抽離估算，並非實際扣牌紀錄。牌路本身不會被當成下一局必然趨勢。';
 const confidence=hasKnown?(sim.knownN>=80?'中（進房後已知牌較多，但仍有未知前段牌）':'低（仍有大量未知牌面）'):(hasRoad?'低（只有前段結果，尚無已知牌面）':'低（尚未輸入牌面）');
 $('recommend').textContent='訊號依據：牌面扣除後的模擬機率，與賠率損益平衡點比較；期望值＝命中機率 × 淨賠率 − 未命中機率。資料可信度：'+confidence+'。中途進房前的實際發牌張數與點數未知，故這是近似估算，不是精確牌靴計數；即使顯示正期望值，也不保證下一局命中。';
}
$('clearAllRoad').addEventListener('click',()=>{if(confirm('確定清空本靴全部紀錄？包含前段路單、實際牌面與所有格盤資料。此操作無法復原。')){s().rounds=[];forecast=null;chosen=null;persist();$('pCards').value='';$('bCards').value='';document.querySelectorAll('[data-result]').forEach(x=>x.classList.remove('selected'));$('hint').textContent='本靴全部紀錄已清空。';}});
$('newShoe').onclick=()=>{db.shoes.push({rounds:[]});db.active=db.shoes.length-1;persist()};
$('backup').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='baccarat-records.json';a.click();URL.revokeObjectURL(a.href)};
render();
