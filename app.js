const KEY='baccarat-quick-v2';
let db;
try{db=JSON.parse(localStorage.getItem(KEY))||{shoes:[{rounds:[]}],active:0}}catch{db={shoes:[{rounds:[]}],active:0}}
if(!Array.isArray(db.shoes)||!db.shoes.length)db={shoes:[{rounds:[]}],active:0};
let chosen=null;
const $=id=>document.getElementById(id),s=()=>db.shoes[db.active],persist=()=>{localStorage.setItem(KEY,JSON.stringify(db));render()};
const rankList=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
document.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{chosen=b.dataset.result;document.querySelectorAll('[data-result]').forEach(x=>x.classList.toggle('selected',x===b))});
function cards(v){return v.toUpperCase().split(/[ ,，、]+/).filter(Boolean)}
function valid(a){return a.every(x=>rankList.includes(x))}
function score(a){return a.reduce((n,x)=>n+(x==='A'?1:['10','J','Q','K'].includes(x)?0:+x),0)%10}
function parseRoad(v){
 const map={'莊':'B','庄':'B','B':'B','閒':'P','闲':'P','P':'P','和':'T','T':'T'};
 return [...v.toUpperCase()].filter(ch=>!/[\s,，、|/;；]/.test(ch)).map(ch=>map[ch]).filter(Boolean);
}
$('loadRoad').onclick=()=>{
 const raw=$('pastRoad').value.trim(),seq=parseRoad(raw);
 if(!raw||!seq.length)return alert('請輸入之前開出的莊、閒、和結果，例如：莊莊閒莊閒和');
 if(seq.length!==[...raw.toUpperCase()].filter(ch=>!/[\s,，、|/;；]/.test(ch)).length)return alert('路單含有無法辨識的字元，請只輸入莊、閒、和或 B、P、T。');
 const old=s().rounds.filter(x=>!x.imported);
 s().rounds=[...seq.map(result=>({result,p:[],b:[],imported:true,at:Date.now()})),...old];
 $('setupStatus').textContent='已載入 '+seq.length+' 局前段路單；未知牌面不會假裝成已知牌。';
 $('pastRoad').value='';persist();
};
function saveRound(){
 if(!chosen)return alert('請先點選這局是莊贏、閒贏或和局');
 let p=cards($('pCards').value),b=cards($('bCards').value);
 if(!valid(p)||!valid(b))return alert('牌面請填 A、2–10、J、Q、K，以空格分開');
 if((p.length||b.length)&&(!p.length||!b.length||p.length<2||b.length<2||p.length>3||b.length>3))return alert('牌面請輸入閒家及莊家各 2–3 張；若不知道牌面，兩邊都留空');
 if(p.length&&b.length){
  const expected=score(b)===score(p)?'T':score(b)>score(p)?'B':'P';
  if(expected!==chosen&&!confirm('依照輸入牌面計算結果為「'+({B:'莊贏',P:'閒贏',T:'和局'}[expected])+'」，但你選的是「'+({B:'莊贏',P:'閒贏',T:'和局'}[chosen])+'」。仍要保存嗎？'))return;
 }
 s().rounds.push({result:chosen,p,b,imported:false,at:Date.now()});
 $('pCards').value='';$('bCards').value='';chosen=null;
 document.querySelectorAll('[data-result]').forEach(x=>x.classList.remove('selected'));
 $('hint').textContent='已保存本局；已知牌面會從牌組扣除並重新估算。';persist();
}
$('save').onclick=saveRound;
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function simulate(n=16000){
 const rounds=s().rounds,known=rounds.filter(x=>!x.imported&&x.p?.length&&x.b?.length);
 const prior=rounds.filter(x=>x.imported).length;
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
 $('road').innerHTML=r.slice(-100).map(x=>'<span class="dot '+x.result+'">'+({B:'莊',P:'閒',T:'和'}[x.result])+'</span>').join('')||'<span class="hint">尚未建立路單。</span>';
 $('historyCount').textContent='本靴共 '+r.length+' 局｜莊 '+r.filter(x=>x.result==='B').length+' 局・閒 '+r.filter(x=>x.result==='P').length+' 局・和 '+r.filter(x=>x.result==='T').length+' 局｜已知牌面 '+(sim.knownN||0)+' 張';
 if(sim.error){$('caveat').textContent=sim.error;return}
 const p=sim.probs;
 $('mainPicks').innerHTML=[['莊勝',p.B],['閒勝',p.P],['和局',p.T]].map(([n,v])=>'<div class="pick"><small>'+n+'</small><b>'+pct(v)+'</b><span>牌靴條件模擬估算</span></div>').join('');
 const bets=[['閒對',p.pairP,11,'閒家前兩張同點數'],['莊對',p.pairB,11,'莊家前兩張同點數'],['和局',p.T,8,'莊閒最終點數相同']];
 $('sidePicks').innerHTML=bets.map(([name,prob,odds,desc])=>{
  const value=ev(prob,odds),threshold=1/(odds+1),signal=value>0;
  return '<div class="side-row"><div><b>'+name+'</b><small>'+desc+'｜賠 '+odds+':1｜損益平衡 '+pct(threshold)+'</small></div><div class="signal-detail"><b>'+pct(prob)+'</b><small>期望值 '+(value>=0?'+':'')+pct(value)+'</small><strong class="'+(signal?'signal-on':'signal-off')+'">'+(signal?'模型正期望值訊號':'暫不下注')+'</strong></div></div>';
 }).join('');
 const hasRoad=sim.prior>0,hasKnown=sim.knownN>0;
 $('caveat').textContent='目前已知並扣除 '+sim.knownN+' 張進房後牌面。進房前 '+sim.prior+' 局只有結果、沒有牌面；模型以每局平均約 4.8 張作隨機未知牌抽離估算，並非實際扣牌紀錄。牌路本身不會被當成下一局必然趨勢。';
 const confidence=hasKnown?(sim.knownN>=80?'中（進房後已知牌較多，但仍有未知前段牌）':'低（仍有大量未知牌面）'):(hasRoad?'低（只有前段結果，尚無已知牌面）':'低（尚未輸入牌面）');
 $('recommend').textContent='訊號依據：牌面扣除後的模擬機率，與賠率損益平衡點比較；期望值＝命中機率 × 淨賠率 − 未命中機率。資料可信度：'+confidence+'。中途進房前的實際發牌張數與點數未知，故這是近似估算，不是精確牌靴計數；即使顯示正期望值，也不保證下一局命中。';
}
$('clear').onclick=()=>{if(confirm('確定清除目前牌靴紀錄？')){s().rounds=[];persist()}};
$('newShoe').onclick=()=>{db.shoes.push({rounds:[]});db.active=db.shoes.length-1;persist()};
$('backup').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='baccarat-records.json';a.click();URL.revokeObjectURL(a.href)};
render();
