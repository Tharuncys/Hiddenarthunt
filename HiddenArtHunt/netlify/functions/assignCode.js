const {initAdmin}=require('./_common');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return{statusCode:405,body:'POST only'};
  try{
    initAdmin();
    const admin=require('firebase-admin');
    const db=admin.firestore();
    const body=JSON.parse(event.body||'{}');
    const {teamName,round}=body;
    if(!teamName)return{statusCode:400,body:'missing team'};

    const code=await db.runTransaction(async(tx)=>{
      const q=await tx.get(db.collection('secretCodes').where('used','==',false).limit(1));
      if(q.empty)throw'No codes left';
      const doc=q.docs[0];tx.update(doc.ref,{used:true,assignedTo:teamName});
      return doc.data().code;
    });
    await db.collection('teams').doc(teamName).set({[`${round}Key`]:code},{merge:true});
    return{statusCode:200,body:JSON.stringify({code})};
  }catch(e){return{statusCode:500,body:e.message}}
};
