const {initAdmin}=require('./_common');
exports.handler=async(event)=>{
  const user=event.headers['x-admin-user'],pass=event.headers['x-admin-pass'];
  if(user!==process.env.ADMIN_USER||pass!==process.env.ADMIN_PASS)
    return{statusCode:401,body:'Unauthorized'};
  try{
    initAdmin();
    const admin=require('firebase-admin');
    const db=admin.firestore();
    const snap=await db.collection('teams').get();
    const rows=[];snap.forEach(d=>{rows.push(d.data())});
    const keys=Object.keys(rows[0]||{teamName:'',round1Passed:'',round2Passed:''});
    const csv=[keys.join(',')].concat(rows.map(r=>keys.map(k=>r[k]||'').join(','))).join('\n');
    return{statusCode:200,headers:{'Content-Type':'text/csv'},body:csv};
  }catch(e){return{statusCode:500,body:e.message}}
};
