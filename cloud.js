const cfg=window.FIREBASE_CONFIG;
if(cfg){
  Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]).then(([appMod,fsMod])=>{
    const app=appMod.initializeApp(cfg),db=fsMod.getFirestore(app),ref=fsMod.doc(db,"apps","rental-manager");
    window.cloudSync={save:state=>fsMod.setDoc(ref,{state,updatedAt:fsMod.serverTimestamp()})};
    fsMod.onSnapshot(ref,snap=>{if(snap.exists()&&snap.data().state)window.onCloudState(snap.data().state)});
    window.setCloudStatus(true);
  }).catch(()=>window.setCloudStatus(false));
}else window.setCloudStatus(false);
