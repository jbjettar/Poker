const KEY='pokerCampeonatoJorgeV1';
const init=()=>({players:Array.from({length:12},(_,i)=>({id:i+1,name:`Jogador ${i+1}`,active:true})),events:[]});
let state;try{state=JSON.parse(localStorage.getItem(KEY))||init()}catch{state=init()}
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const brl=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const num=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const pts=(r,natal)=>((+r.received||0)-(+r.additional||0))*(natal?2:1);

function ranking(){
  const map={}; state.players.forEach(p=>map[p.id]={...p,points:0,played:0,received:0,additional:0});
  state.events.forEach(e=>e.results.forEach(r=>{let p=map[r.playerId]; if(!p)return; p.points+=pts(r,e.christmas); p.played++; p.received+=+r.received||0; p.additional+=+r.additional||0;}));
  return Object.values(map).sort((a,b)=>b.points-a.points);
}
function renderRanking(){
  const el=document.getElementById('rankingList');
  if(!state.events.length){el.innerHTML='<div class="empty">Nenhuma etapa registrada ainda.</div>';return}
  el.innerHTML=ranking().map((p,i)=>`<div class="rankRow"><div class="name">${i+1}º</div><div><div class="name">${p.name}</div><div class="small">${p.played} etapa(s) · recebeu ${brl(p.received)} · recompras ${brl(p.additional)}</div></div><div class="pts ${p.points<0?'neg':'pos'}">${num(p.points)}</div></div>`).join('');
}
function renderForm(){
  document.getElementById('resultsForm').innerHTML=state.players.filter(p=>p.active).map(p=>`<div class="playerRow" data-id="${p.id}"><label class="check"><input type="checkbox" class="part"><span class="name">${p.name}</span></label><label>Recompras<input class="additional" type="number" inputmode="numeric" min="0" step="50" value="0"></label><label>Recebido<input class="received" type="number" inputmode="numeric" min="0" step="50" value="0"></label></div>`).join('');
}
function renderPlayers(){
  document.getElementById('playersEdit').innerHTML=state.players.map(p=>`<div class="editRow" data-id="${p.id}"><label class="check"><input class="activePlayer" type="checkbox" ${p.active?'checked':''}></label><input class="playerName" value="${p.name.replaceAll('"','&quot;')}"></div>`).join('');
}
function renderHistory(){
  const el=document.getElementById('historyList');
  if(!state.events.length){el.innerHTML='<div class="empty">Nenhuma etapa registrada ainda.</div>';return}
  el.innerHTML=[...state.events].reverse().map(e=>{
    const total=e.results.reduce((s,r)=>s+pts(r,e.christmas),0);
    const lines=e.results.map(r=>{const p=state.players.find(x=>x.id===r.playerId);return `<div class="small">${p?.name||'Jogador'}: ${num(pts(r,e.christmas))} pts · recebeu ${brl(r.received)} · recompras ${brl(r.additional)}</div>`}).join('');
    return `<div class="eventRow"><div class="name">${e.name}${e.christmas?'<span class="badge">Natal 2x</span>':''}</div><div class="small">${e.date||'Sem data'} · ${e.results.length} jogador(es) · ${num(total)} pontos</div>${lines}</div>`;
  }).join('');
}
function render(){renderRanking();renderForm();renderPlayers();renderHistory()}
document.querySelectorAll('.tabBtn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabBtn').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active')});
document.getElementById('eventDate').valueAsDate=new Date();
document.getElementById('saveEvent').onclick=()=>{const rows=[...document.querySelectorAll('.playerRow')];const results=rows.map(row=>row.querySelector('.part').checked?{playerId:+row.dataset.id,additional:+row.querySelector('.additional').value||0,received:+row.querySelector('.received').value||0}:null).filter(Boolean);if(!results.length){alert('Marque pelo menos um participante.');return}state.events.push({id:Date.now(),date:document.getElementById('eventDate').value,name:document.getElementById('eventName').value||`Etapa ${state.events.length+1}`,christmas:document.getElementById('christmas').checked,results});save();document.getElementById('eventName').value='';document.getElementById('christmas').checked=false;render();document.querySelector('[data-tab="ranking"]').click()};
document.getElementById('savePlayers').onclick=()=>{document.querySelectorAll('.editRow').forEach(row=>{let p=state.players.find(x=>x.id==row.dataset.id);p.name=row.querySelector('.playerName').value||`Jogador ${p.id}`;p.active=row.querySelector('.activePlayer').checked});save();render();alert('Jogadores salvos.')};
document.getElementById('resetAll').onclick=()=>{if(confirm('Apagar todos os dados?')){state=init();save();render()}};
document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='backup-campeonato-poker.json';a.click();URL.revokeObjectURL(url)};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
