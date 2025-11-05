const {initAdmin}=require('./_common');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return{statusCode:405,body:'POST only'};
  try{
    initAdmin();
    const admin=require('firebase-admin');
    const db=admin.firestore();
    const body=JSON.parse(event.body||'{}');
    const {teamName,round,index,answer}=body;
    if(!teamName||!round)return{statusCode:400,body:'Missing fields'};
    const ansDoc=await db.collection('answers').doc(round).get();
    const correctAns=(ansDoc.exists?(ansDoc.data()[String(index)]||''):'' ).trim().toLowerCase();
    const correct=correctAns&&correctAns===answer.trim().toLowerCase();

    const teamRef=db.collection('teams').doc(teamName);
    await teamRef.set({teamName},{merge:true});
    await db.collection('submissions').add({
      teamName,round,index,answer,verified:correct,
      submittedAt:admin.firestore.FieldValue.serverTimestamp()
    });

    const snap=await teamRef.get();const data=snap.data()||{};
    const key=`${round}Correct`;const cnt=(data[key]||0)+(correct?1:0);
    const passed=round==='round1'?cnt>=2:cnt>=4;
    await teamRef.set({[key]:cnt,[`${round}Passed`]:passed},{merge:true});

    return{statusCode:200,body:JSON.stringify({correct,passed})};
  }catch(e){return{statusCode:500,body:e.message}}
};
