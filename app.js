import "./cloud.js";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="rental-manager-v5";
const AHMAD_ROOMS=[
"Ahmad 1st Floor Room#1","Ahmad 1st Floor Room#2","Ahmad 1st Floor Room#3","Ahmad 1st Floor Room#4",
"Ahmad 2nd Floor Room#1","Ahmad 2nd Floor Room#2","Ahmad 2nd Floor Room#3",
"Ahmad 3rd Floor Room#1","Ahmad 3rd Floor Room#2","Ahmad 3rd Floor Room#3"
];
const defaultState=()=>({rooms:AHMAD_ROOMS.map((name,i)=>({id:"ahmad-"+(i+1),house:"Ahmad",name,rent:0})),tenants:[],payments:[],expenses:[],ledgers:[],archive:[]});
let state=load(),roomHouse="Aladdin",tenantHouse="Aladdin",expenseOwner="Aladdin",ledgerOwner="Aladdin";
function load(){try{return {...defaultState(),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll();scheduleCloudSave()}
const uid=()=>crypto.randomUUID?.()||Date.now()+"-"+Math.random();
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const roomById=id=>state.rooms.find(r=>r.id===id);
const tenantByRoom=id=>state.tenants.find(t=>t.roomId===id);
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function today(){return new Date().toISOString().slice(0,10)}

function renderAll(){renderDashboard();renderRooms();renderTenants();renderPayments();renderExpenses();renderLedgers();renderArchive();fillPaymentTenants()}
function renderDashboard(){
 const monthly=state.tenants.reduce((s,t)=>s+Number(t.rent||roomById(t.roomId)?.rent||0),0);
 const expenses=state.expenses.reduce((s,x)=>s+Number(x.amount||0),0);
 $("#statOccupied").textContent=state.tenants.length;$("#statTenants").textContent=state.tenants.length;$("#statIncome").textContent=money(monthly);$("#statExpenses").textContent=money(expenses);
 const now=new Date();now.setHours(0,0,0,0);const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);const alerts=[];
 state.tenants.forEach(t=>{const r=roomById(t.roomId);if(t.end){const end=new Date(t.end+"T12:00:00");end.setHours(0,0,0,0);const d=Math.round((end-now)/86400000);if(d===30)alerts.push(`${t.name} — ${r?.name||""}: تبقى 30 يومًا على نهاية العقد`)}
 const due=Number(t.dueDay||1),last=new Date(tomorrow.getFullYear(),tomorrow.getMonth()+1,0).getDate();if(Math.min(due,last)===tomorrow.getDate())alerts.push(`${t.name} — ${r?.name||""}: الإيجار مستحق غدًا`)});
 $("#alertsList").innerHTML=alerts.length?alerts.map(a=>`<div class="list-item"><div>${esc(a)}</div></div>`).join(""):`<div class="empty">لا توجد تنبيهات حاليًا</div>`;
}
function renderRooms(){
 const q=$("#roomSearch").value.toLowerCase();
 const occupied=state.rooms.filter(r=>r.house===roomHouse).map(r=>({r,t:tenantByRoom(r.id)})).filter(x=>x.t).filter(x=>(x.r.name+" "+x.t.name).toLowerCase().includes(q));
 $("#roomsGrid").innerHTML=occupied.length?occupied.map(({r,t})=>`<article class="room-card"><span class="badge">مؤجرة</span><h3>${esc(r.name)}</h3><div class="meta">المستأجر: ${esc(t.name)}<br>الإيجار: ${money(t.rent||r.rent)}<br>الهاتف: ${esc(t.phone||"-")}</div><div class="actions"><button class="secondary" onclick="editRoom('${r.id}')">تعديل</button></div></article>`).join(""):`<div class="empty">لا توجد غرف مؤجرة في هذه القائمة</div>`;
}
function renderTenants(){
 const q=$("#tenantSearch").value.toLowerCase(),rows=state.tenants.filter(t=>roomById(t.roomId)?.house===tenantHouse).filter(t=>(t.name+" "+(t.phone||"")).toLowerCase().includes(q));
 $("#tenantList").innerHTML=rows.length?rows.map(t=>{const r=roomById(t.roomId);return `<div class="tenant-card"><h3>${esc(t.name)}</h3><div class="meta">${esc(r?.name||"")}<br>الإيجار: ${money(t.rent||r?.rent)} · الاستحقاق: يوم ${t.dueDay||1}<br>${esc(t.phone||"")}</div><div class="actions"><button class="secondary" onclick="editTenant('${t.id}')">تعديل</button><button class="danger" onclick="archiveTenant('${t.id}')">إنهاء</button></div></div>`}).join(""):`<div class="empty">لا يوجد مستأجرون</div>`;
}
function renderPayments(){
 const rows=[...state.payments].sort((a,b)=>b.date.localeCompare(a.date));
 $("#paymentsList").innerHTML=rows.length?rows.map(p=>{const t=state.tenants.find(x=>x.id===p.tenantId)||state.archive.find(x=>x.id===p.tenantId);return `<div class="list-item"><div><strong>${esc(t?.name||"مستأجر")}</strong><div class="meta">${p.date} · ${esc(p.method)} · ${esc(p.note||"")}</div></div><strong>${money(p.amount)}</strong></div>`}).join(""):`<div class="empty">لا توجد دفعات</div>`;
}
function renderTable(kind,owner,bodyId){
 const rows=state[kind].filter(x=>x.owner===owner).sort((a,b)=>b.date.localeCompare(a.date));
 $(bodyId).innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td>${x.date}</td><td>${esc(x.note||"")}</td><td><button class="danger" onclick="deleteRow('${kind}','${x.id}')">حذف</button></td></tr>`).join(""):`<tr><td colspan="5" class="empty">لا توجد سجلات</td></tr>`;
}
function renderExpenses(){renderTable("expenses",expenseOwner,"#expenseBody")}
function renderLedgers(){renderTable("ledgers",ledgerOwner,"#ledgerBody")}
function renderArchive(){$("#archiveList").innerHTML=state.archive.length?state.archive.map(t=>`<div class="list-item"><div><strong>${esc(t.name)}</strong><div class="meta">${esc(t.roomName||"")} · ${t.end||""}</div></div></div>`).join(""):`<div class="empty">الأرشيف فارغ</div>`}
function fillPaymentTenants(){$("#paymentTenant").innerHTML=state.tenants.map(t=>`<option value="${t.id}">${esc(t.name)} — ${esc(roomById(t.roomId)?.name||"")}</option>`).join("")}

function updateRoomNameControl(){
 const ahmad=$("#roomHouse").value==="Ahmad";$("#roomNameSelect").style.display=ahmad?"block":"none";$("#roomNameCustom").style.display=ahmad?"none":"block";
 $("#roomNameSelect").innerHTML=AHMAD_ROOMS.map(n=>`<option>${n}</option>`).join("");
}
function fillTenantRooms(selected=""){
 const house=$("#tenantHouse").value;const current=$("#tenantId").value;const currentTenant=state.tenants.find(t=>t.id===current);
 const rooms=state.rooms.filter(r=>r.house===house).filter(r=>!tenantByRoom(r.id)||currentTenant?.roomId===r.id);
 $("#tenantRoom").innerHTML=rooms.map(r=>`<option value="${r.id}" ${r.id===selected?"selected":""}>${esc(r.name)}</option>`).join("");
}

$("#addRoomBtn").onclick=()=>{ $("#roomForm").reset();$("#roomId").value="";$("#roomHouse").value=roomHouse;updateRoomNameControl();$("#roomDialog").showModal() };
$("#roomHouse").onchange=updateRoomNameControl;
$("#roomForm").onsubmit=e=>{e.preventDefault();const id=$("#roomId").value||uid(),house=$("#roomHouse").value,name=house==="Ahmad"?$("#roomNameSelect").value:$("#roomNameCustom").value.trim();if(!name)return;
 const duplicate=state.rooms.find(r=>r.house===house&&r.name===name&&r.id!==id);if(duplicate){toast("هذه الغرفة موجودة مسبقًا");return}
 const room={id,house,name,rent:Number($("#roomRent").value||0)};const i=state.rooms.findIndex(r=>r.id===id);i>=0?state.rooms[i]=room:state.rooms.push(room);$("#roomDialog").close();save();toast("تم حفظ الغرفة")};
window.editRoom=id=>{const r=roomById(id);$("#roomId").value=r.id;$("#roomHouse").value=r.house;updateRoomNameControl();if(r.house==="Ahmad")$("#roomNameSelect").value=r.name;else $("#roomNameCustom").value=r.name;$("#roomRent").value=r.rent;$("#roomDialog").showModal()};

$("#addTenantBtn").onclick=()=>{$("#tenantForm").reset();$("#tenantId").value="";$("#tenantHouse").value=tenantHouse;fillTenantRooms();$("#tenantStart").value=today();$("#tenantDueDay").value=1;$("#tenantDialog").showModal()};
$("#tenantHouse").onchange=()=>fillTenantRooms();
$("#tenantRoom").onchange=()=>{const r=roomById($("#tenantRoom").value);if(r)$("#tenantRent").value=r.rent||""};
$("#tenantForm").onsubmit=e=>{e.preventDefault();const id=$("#tenantId").value||uid(),roomId=$("#tenantRoom").value;if(!roomId){toast("أضف غرفة متاحة أولًا");return}const old=state.tenants.find(t=>t.id===id);
 const t={id,name:$("#tenantName").value.trim(),phone:$("#tenantPhone").value.trim(),roomId,rent:Number($("#tenantRent").value||0),start:$("#tenantStart").value,end:$("#tenantEnd").value,deposit:Number($("#tenantDeposit").value||0),dueDay:Number($("#tenantDueDay").value||1),notes:$("#tenantNotes").value.trim()};
 const i=state.tenants.findIndex(x=>x.id===id);i>=0?state.tenants[i]=t:state.tenants.push(t);const r=roomById(roomId);if(r)r.rent=t.rent;$("#tenantDialog").close();save();toast("تم حفظ المستأجر")};
window.editTenant=id=>{const t=state.tenants.find(x=>x.id===id),r=roomById(t.roomId);$("#tenantId").value=t.id;$("#tenantName").value=t.name;$("#tenantPhone").value=t.phone||"";$("#tenantHouse").value=r?.house||"Aladdin";fillTenantRooms(t.roomId);$("#tenantRent").value=t.rent||r?.rent||0;$("#tenantStart").value=t.start;$("#tenantEnd").value=t.end||"";$("#tenantDeposit").value=t.deposit||0;$("#tenantDueDay").value=t.dueDay||1;$("#tenantNotes").value=t.notes||"";$("#tenantDialog").showModal()};
window.archiveTenant=id=>{if(!confirm("إنهاء هذا المستأجر ونقله إلى الأرشيف؟"))return;const t=state.tenants.find(x=>x.id===id),r=roomById(t.roomId);state.archive.push({...t,roomName:r?.name,end:t.end||today()});state.tenants=state.tenants.filter(x=>x.id!==id);save()};

$("#addPaymentBtn").onclick=()=>{$("#paymentForm").reset();fillPaymentTenants();$("#paymentDate").value=today();$("#paymentDialog").showModal()};
$("#paymentForm").onsubmit=e=>{e.preventDefault();state.payments.push({id:uid(),tenantId:$("#paymentTenant").value,amount:Number($("#paymentAmount").value),date:$("#paymentDate").value,method:$("#paymentMethod").value,note:$("#paymentNote").value.trim()});$("#paymentDialog").close();save();toast("تم حفظ الدفعة")};

function openExpense(id=""){const x=state.expenses.find(v=>v.id===id);$("#expenseId").value=x?.id||"";$("#expenseOwner").value=x?.owner||expenseOwner;$("#expenseName").value=x?.name||"";$("#expenseAmount").value=x?.amount||"";$("#expenseDate").value=x?.date||today();$("#expenseNote").value=x?.note||"";$("#expenseDialog").showModal()}
$("#addExpenseBtn").onclick=()=>openExpense();
$("#expenseForm").onsubmit=e=>{e.preventDefault();upsert("expenses",{id:$("#expenseId").value||uid(),owner:$("#expenseOwner").value,name:$("#expenseName").value.trim(),amount:Number($("#expenseAmount").value),date:$("#expenseDate").value,note:$("#expenseNote").value.trim()});expenseOwner=$("#expenseOwner").value;$("#expenseDialog").close();save();toast("تم حفظ المصروف")};

function openLedger(id=""){const x=state.ledgers.find(v=>v.id===id);$("#ledgerId").value=x?.id||"";$("#ledgerOwner").value=x?.owner||ledgerOwner;$("#ledgerName").value=x?.name||"";$("#ledgerAmount").value=x?.amount||"";$("#ledgerDate").value=x?.date||today();$("#ledgerNote").value=x?.note||"";$("#ledgerDialog").showModal()}
$("#addLedgerBtn").onclick=()=>openLedger();
$("#ledgerForm").onsubmit=e=>{e.preventDefault();upsert("ledgers",{id:$("#ledgerId").value||uid(),owner:$("#ledgerOwner").value,name:$("#ledgerName").value.trim(),amount:Number($("#ledgerAmount").value),date:$("#ledgerDate").value,note:$("#ledgerNote").value.trim()});ledgerOwner=$("#ledgerOwner").value;$("#ledgerDialog").close();save();toast("تم حفظ السجل")};
function upsert(kind,row){const i=state[kind].findIndex(x=>x.id===row.id);i>=0?state[kind][i]=row:state[kind].push(row)}
window.deleteRow=(kind,id)=>{if(confirm("حذف السجل؟")){state[kind]=state[kind].filter(x=>x.id!==id);save()}};

$$("dialog .cancel").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$$(".bottom-nav button").forEach(b=>b.onclick=()=>{$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(p=>p.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})});
function tabHandler(container,key,cb){$(container).onclick=e=>{const b=e.target.closest("button");if(!b)return;$$(container+" button").forEach(x=>x.classList.toggle("active",x===b));cb(b.dataset[key])}}
tabHandler("#roomHouseTabs","house",v=>{roomHouse=v;renderRooms()});tabHandler("#tenantHouseTabs","house",v=>{tenantHouse=v;renderTenants()});tabHandler("#expenseTabs","owner",v=>{expenseOwner=v;renderExpenses()});tabHandler("#ledgerTabs","owner",v=>{ledgerOwner=v;renderLedgers()});
$("#roomSearch").oninput=renderRooms;$("#tenantSearch").oninput=renderTenants;

$("#exportBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="rental-backup-"+today()+".json";a.click()};
$("#importInput").onchange=async e=>{try{state={...defaultState(),...JSON.parse(await e.target.files[0].text())};save();toast("تمت الاستعادة")}catch{toast("الملف غير صالح")}};

let cloudTimer;
function scheduleCloudSave(){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>window.cloudSync?.save?.(state),500)}
window.onCloudState=s=>{state={...defaultState(),...s};localStorage.setItem(KEY,JSON.stringify(state));renderAll()};
window.setCloudStatus=ok=>{const b=$("#syncBadge");b.textContent=ok?"متصل بالسحابة":"حفظ محلي";b.classList.toggle("cloud",ok);b.classList.toggle("local",!ok)};

renderAll();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
