const DB_KEY = "rentalManagerPWA_v1";
const defaultState = () => ({
  lang: "ar",
  activeHouse: "Aladdin",
  rooms: [
    ...Array.from({length:20},(_,i)=>({id:crypto.randomUUID(),house:"Aladdin",name:`Room #${i+1}`,rent:0})),
    ...Array.from({length:20},(_,i)=>({id:crypto.randomUUID(),house:"Ahmad",name:`Room #${i+1}`,rent:0}))
  ],
  tenants: [],
  archived: [],
  payments: []
});
let state = load();
function load(){ try{ return JSON.parse(localStorage.getItem(DB_KEY)) || defaultState(); }catch{return defaultState();}}
function save(){ localStorage.setItem(DB_KEY,JSON.stringify(state)); renderAll(); }
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const t={
 ar:{appTitle:"إدارة الإيجارات",subtitle:"بيتا Aladdin و Ahmad",rooms:"الغرف",occupied:"المشغولة",vacant:"الشاغرة",income:"إيجار شهري",alerts:"التنبيهات",tenants:"المستأجرون الحاليون",payments:"الدفعات",archive:"المستأجرون السابقون",backup:"النسخ الاحتياطي",backupText:"صدّر نسخة من جميع البيانات واحفظها في تطبيق الملفات أو iCloud Drive.",export:"تصدير نسخة احتياطية",import:"استعادة نسخة احتياطية",danger:"إعادة ضبط التطبيق",reset:"حذف جميع البيانات",nav:["الرئيسية","الغرف","المستأجرون","الدفعات","الأرشيف","الإعدادات"],addRoom:"+ غرفة",addTenant:"+ مستأجر",addPayment:"+ دفعة",searchRoom:"بحث بالغرفة أو المستأجر",searchTenant:"بحث بالاسم أو الهاتف",empty:"لا توجد بيانات",occupiedWord:"مشغولة",vacantWord:"شاغرة",rent:"الإيجار",tenant:"المستأجر",phone:"الهاتف",period:"الفترة",edit:"تعديل",archiveBtn:"أرشفة",delete:"حذف",paid:"دفع",confirmArchive:"هذه الغرفة مشغولة. سيتم أرشفة المستأجر الحالي واستبداله. هل تريد المتابعة؟",confirmDelete:"هل أنت متأكد؟",saved:"تم الحفظ",archivedMsg:"تمت الأرشفة",deleted:"تم الحذف",imported:"تمت استعادة البيانات",resetDone:"تم حذف جميع البيانات",expiry:"ينتهي عقده خلال",days:"يوم",overdue:"انتهى العقد",noAlerts:"لا توجد تنبيهات حالياً"},
 en:{appTitle:"Rental Manager",subtitle:"Aladdin & Ahmad Houses",rooms:"Rooms",occupied:"Occupied",vacant:"Vacant",income:"Monthly Rent",alerts:"Alerts",tenants:"Current Tenants",payments:"Payments",archive:"Past Tenants",backup:"Backup",backupText:"Export all data and save it to Files or iCloud Drive.",export:"Export Backup",import:"Restore Backup",danger:"Reset App",reset:"Delete All Data",nav:["Home","Rooms","Tenants","Payments","Archive","Settings"],addRoom:"+ Room",addTenant:"+ Tenant",addPayment:"+ Payment",searchRoom:"Search room or tenant",searchTenant:"Search name or phone",empty:"No data",occupiedWord:"Occupied",vacantWord:"Vacant",rent:"Rent",tenant:"Tenant",phone:"Phone",period:"Period",edit:"Edit",archiveBtn:"Archive",delete:"Delete",paid:"Payment",confirmArchive:"This room is occupied. The current tenant will be archived and replaced. Continue?",confirmDelete:"Are you sure?",saved:"Saved",archivedMsg:"Archived",deleted:"Deleted",imported:"Backup restored",resetDone:"All data deleted",expiry:"Lease ends in",days:"days",overdue:"Lease expired",noAlerts:"No alerts now"}
};
function tr(k){return t[state.lang][k]}
function money(v){return new Intl.NumberFormat(state.lang==="ar"?"ar-US":"en-US",{style:"currency",currency:"USD"}).format(Number(v||0))}
function fmtDate(d){if(!d)return"-";return new Date(d+"T12:00:00").toLocaleDateString(state.lang==="ar"?"ar-US":"en-US")}
function tenantForRoom(id){return state.tenants.find(x=>x.roomId===id)}
function roomById(id){return state.rooms.find(x=>x.id===id)}
function toast(m){const el=$("#toast");el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
function renderText(){
 document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
 $("#appTitle").textContent=tr("appTitle");$("#subtitle").textContent=tr("subtitle");$("#langBtn").textContent=state.lang==="ar"?"English":"العربية";
 $("#statRoomsLabel").textContent=tr("rooms");$("#statOccupiedLabel").textContent=tr("occupied");$("#statVacantLabel").textContent=tr("vacant");$("#statIncomeLabel").textContent=tr("income");$("#alertsTitle").textContent=tr("alerts");
 $("#tenantsTitle").textContent=tr("tenants");$("#paymentsTitle").textContent=tr("payments");$("#archiveTitle").textContent=tr("archive");$("#backupTitle").textContent=tr("backup");$("#backupText").textContent=tr("backupText");
 $("#exportBtn").textContent=tr("export");$("#importLabel").textContent=tr("import");$("#dangerTitle").textContent=tr("danger");$("#resetBtn").textContent=tr("reset");
 [$("#navDashboard"),$("#navRooms"),$("#navTenants"),$("#navPayments"),$("#navArchive"),$("#navSettings")].forEach((e,i)=>e.textContent=tr("nav")[i]);
 $("#addRoomBtn").textContent=tr("addRoom");$("#addTenantBtn").textContent=tr("addTenant");$("#addPaymentBtn").textContent=tr("addPayment");$("#roomSearch").placeholder=tr("searchRoom");$("#tenantSearch").placeholder=tr("searchTenant");
}
function renderDashboard(){
 const occ=state.tenants.length;$("#statRooms").textContent=state.rooms.length;$("#statOccupied").textContent=occ;$("#statVacant").textContent=state.rooms.length-occ;
 $("#statIncome").textContent=money(state.tenants.reduce((s,x)=>s+(roomById(x.roomId)?.rent||0),0));
 const now=new Date(); const alerts=state.tenants.map(x=>{if(!x.end)return null;const end=new Date(x.end+"T23:59:59");const days=Math.ceil((end-now)/86400000);if(days<0)return {x,days};if(days<=30)return{x,days};return null}).filter(Boolean);
 $("#alertsList").innerHTML=alerts.length?alerts.map(a=>`<div class="item"><h3>${a.x.name}</h3><div class="meta">${roomById(a.x.roomId)?.name||""} • ${a.days<0?tr("overdue"):`${tr("expiry")} ${a.days} ${tr("days")}`}</div></div>`).join(""):`<div class="empty">${tr("noAlerts")}</div>`;
}
function renderRooms(){
 $$("#houseTabs button").forEach(b=>b.classList.toggle("active",b.dataset.house===state.activeHouse));
 const q=$("#roomSearch").value.toLowerCase();const rooms=state.rooms.filter(r=>r.house===state.activeHouse).filter(r=>{const te=tenantForRoom(r.id);return r.name.toLowerCase().includes(q)||(te?.name||"").toLowerCase().includes(q)});
 $("#roomsGrid").innerHTML=rooms.map(r=>{const te=tenantForRoom(r.id);return `<div class="room-card ${te?"occupied":"vacant"}"><h3>${r.name}</h3><div class="muted">${tr("rent")}: ${money(r.rent)}</div>${te?`<div class="muted">${tr("tenant")}: ${te.name}</div><span class="badge ok">${tr("occupiedWord")}</span>`:`<span class="badge warn">${tr("vacantWord")}</span>`}<div class="item-actions"><button class="mini edit-room" data-id="${r.id}">${tr("edit")}</button>${te?`<button class="mini edit-tenant" data-id="${te.id}">${tr("edit")}</button>`:`<button class="mini add-to-room" data-id="${r.id}">${tr("addTenant")}</button>`}</div></div>`}).join("");
 bindDynamic();
}
function renderTenants(){
 const q=$("#tenantSearch").value.toLowerCase();const arr=state.tenants.filter(x=>x.name.toLowerCase().includes(q)||(x.phone||"").toLowerCase().includes(q));
 $("#tenantList").innerHTML=arr.length?arr.map(x=>{const r=roomById(x.roomId);return `<div class="item"><h3>${x.name}</h3><div class="meta">${r?.house||""} • ${r?.name||""}<br>${tr("phone")}: ${x.phone||"-"}<br>${tr("period")}: ${fmtDate(x.start)} — ${fmtDate(x.end)}</div><div class="item-actions"><button class="mini edit-tenant" data-id="${x.id}">${tr("edit")}</button><button class="mini archive-tenant" data-id="${x.id}">${tr("archiveBtn")}</button></div></div>`}).join(""):`<div class="empty">${tr("empty")}</div>`;bindDynamic();
}
function renderPayments(){
 const arr=[...state.payments].sort((a,b)=>b.date.localeCompare(a.date));
 $("#paymentsList").innerHTML=arr.length?arr.map(p=>{const te=state.tenants.find(x=>x.id===p.tenantId)||state.archived.find(x=>x.id===p.tenantId);return `<div class="item"><h3>${money(p.amount)} — ${te?.name||"-"}</h3><div class="meta">${fmtDate(p.date)} • ${p.method}${p.note?`<br>${p.note}`:""}</div><div class="item-actions"><button class="mini danger delete-payment" data-id="${p.id}">${tr("delete")}</button></div></div>`}).join(""):`<div class="empty">${tr("empty")}</div>`;bindDynamic();
}
function renderArchive(){
 $("#archiveList").innerHTML=state.archived.length?[...state.archived].reverse().map(x=>`<div class="item"><h3>${x.name}</h3><div class="meta">${x.house||""} • ${x.roomName||""}<br>${tr("period")}: ${fmtDate(x.start)} — ${fmtDate(x.end)}</div></div>`).join(""):`<div class="empty">${tr("empty")}</div>`;
}
function renderAll(){renderText();renderDashboard();renderRooms();renderTenants();renderPayments();renderArchive()}
function bindDynamic(){
 $$(".edit-room").forEach(b=>b.onclick=()=>openRoom(b.dataset.id));
 $$(".add-to-room").forEach(b=>b.onclick=()=>openTenant(null,b.dataset.id));
 $$(".edit-tenant").forEach(b=>b.onclick=()=>openTenant(b.dataset.id));
 $$(".archive-tenant").forEach(b=>b.onclick=()=>archiveTenant(b.dataset.id));
 $$(".delete-payment").forEach(b=>b.onclick=()=>{if(confirm(tr("confirmDelete"))){state.payments=state.payments.filter(x=>x.id!==b.dataset.id);save();toast(tr("deleted"))}});
}
function openRoom(id){
 const r=id?roomById(id):null;$("#roomId").value=r?.id||"";$("#roomHouse").value=r?.house||state.activeHouse;$("#roomName").value=r?.name||`Room #${state.rooms.filter(x=>x.house===state.activeHouse).length+1}`;$("#roomRent").value=r?.rent||0;$("#roomDialog").showModal();
}
function openTenant(id,forcedRoom){
 const x=id?state.tenants.find(v=>v.id===id):null;$("#tenantId").value=x?.id||"";$("#tenantName").value=x?.name||"";$("#tenantPhone").value=x?.phone||"";$("#tenantEmail").value=x?.email||"";$("#tenantStart").value=x?.start||new Date().toISOString().slice(0,10);$("#tenantEnd").value=x?.end||"";$("#tenantDeposit").value=x?.deposit||0;$("#tenantNotes").value=x?.notes||"";
 $("#tenantRoom").innerHTML=state.rooms.map(r=>{const te=tenantForRoom(r.id);return `<option value="${r.id}">${r.house} — ${r.name}${te&&te.id!==x?.id?` (${tr("occupiedWord")}: ${te.name})`:""}</option>`}).join("");$("#tenantRoom").value=forcedRoom||x?.roomId||state.rooms[0]?.id;$("#tenantDialog").showModal();
}
function archiveTenant(id){
 const x=state.tenants.find(v=>v.id===id);if(!x)return;const r=roomById(x.roomId);state.archived.push({...x,archivedAt:new Date().toISOString(),house:r?.house,roomName:r?.name});state.tenants=state.tenants.filter(v=>v.id!==id);save();toast(tr("archivedMsg"));
}
$("#langBtn").onclick=()=>{state.lang=state.lang==="ar"?"en":"ar";save()};
$$(".bottom-nav button").forEach(b=>b.onclick=()=>{$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(p=>p.classList.remove("active"));$("#"+b.dataset.page).classList.add("active")});
$$("#houseTabs button").forEach(b=>b.onclick=()=>{state.activeHouse=b.dataset.house;save()});
$("#roomSearch").oninput=renderRooms;$("#tenantSearch").oninput=renderTenants;
$("#addRoomBtn").onclick=()=>openRoom();$("#addTenantBtn").onclick=()=>openTenant();$("#addPaymentBtn").onclick=()=>{if(!state.tenants.length){toast(tr("empty"));return}$("#paymentTenant").innerHTML=state.tenants.map(x=>`<option value="${x.id}">${x.name}</option>`).join("");$("#paymentDate").value=new Date().toISOString().slice(0,10);$("#paymentAmount").value=roomById(state.tenants[0].roomId)?.rent||0;$("#paymentDialog").showModal()};
$("#paymentTenant").onchange=e=>{$("#paymentAmount").value=roomById(state.tenants.find(x=>x.id===e.target.value)?.roomId)?.rent||0};
$("#roomForm").onsubmit=e=>{e.preventDefault();const id=$("#roomId").value;const obj={id:id||crypto.randomUUID(),house:$("#roomHouse").value,name:$("#roomName").value.trim(),rent:Number($("#roomRent").value||0)};if(id)state.rooms=state.rooms.map(x=>x.id===id?obj:x);else state.rooms.push(obj);$("#roomDialog").close();save();toast(tr("saved"))};
$("#tenantForm").onsubmit=e=>{e.preventDefault();const id=$("#tenantId").value;const roomId=$("#tenantRoom").value;const existing=tenantForRoom(roomId);if(existing&&existing.id!==id){if(!confirm(tr("confirmArchive")))return;archiveTenant(existing.id)}const obj={id:id||crypto.randomUUID(),name:$("#tenantName").value.trim(),phone:$("#tenantPhone").value.trim(),email:$("#tenantEmail").value.trim(),roomId,start:$("#tenantStart").value,end:$("#tenantEnd").value,deposit:Number($("#tenantDeposit").value||0),notes:$("#tenantNotes").value.trim()};if(id)state.tenants=state.tenants.map(x=>x.id===id?obj:x);else state.tenants.push(obj);$("#tenantDialog").close();save();toast(tr("saved"))};
$("#paymentForm").onsubmit=e=>{e.preventDefault();state.payments.push({id:crypto.randomUUID(),tenantId:$("#paymentTenant").value,amount:Number($("#paymentAmount").value),date:$("#paymentDate").value,method:$("#paymentMethod").value,note:$("#paymentNote").value.trim()});$("#paymentDialog").close();save();toast(tr("saved"))};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`rental-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
$("#importInput").onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const data=JSON.parse(await f.text());if(!data.rooms||!data.tenants)throw Error();state=data;save();toast(tr("imported"))}catch{alert("Invalid backup file")}};
$("#resetBtn").onclick=()=>{if(confirm(tr("confirmDelete"))){state=defaultState();save();toast(tr("resetDone"))}};
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
renderAll();
