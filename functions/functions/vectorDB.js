let Firestore = require('@google-cloud/firestore');
let FieldValue = require('@google-cloud/firestore').FieldValue;
let VectorQuery = require('@google-cloud/firestore').VectorQuery;
let VectorQuerySnapshot = require('@google-cloud/firestore').VectorQuerySnapshot;
const functions = require("firebase-functions");
const admin = require("firebase-admin");


//const { createProxyMiddleware } = require('http-proxy-middleware');
//require('./indexProxy.js')(exports);
admin.initializeApp({
    projectId: 'sharedmindss24'
});


exports.storeVector = functions.https.onRequest(async (request, response) => {
    // functions.logger.info("Hello logs!", { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");
    const json = JSON.parse(request.body);
    //console.log("welcome", json);
    let back = await storit(json);
    response.status(200).send({ "repsonse": "hey" });
});

exports.findNearest = functions.https.onRequest(async (request, response) => {
    // functions.logger.info("Hello logs!", { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");
    const json = JSON.parse(request.body);
    //console.log("findNearest", json);

    const db = new Firestore();
    const coll = db.collection('coffee-beans');
    console.log("length", json.embedding.length);
    // Requires single-field vector index
    const vectorQuery = coll.findNearest('embedding', FieldValue.vector(json.embedding), {
        limit: 2,
        distanceMeasure: 'COSINE'
    });

    let VectorQuerySnapshot = await vectorQuery.get();
    if (VectorQuerySnapshot.empty) {
        console.log('NO DOCUMENTS FOUND.');
    } else {
        let docs = VectorQuerySnapshot.docs;
        for (let doc of docs) {
            console.log(`Document found at path: ${doc.ref.path}`);
        }
    }

    // console.log("VectorQuerySnapshot", VectorQuerySnapshot);
    response.status(200).send({ "repsonse": VectorQuerySnapshot });

});




async function storit(incoming) {
    const db = new Firestore();
    const coll = db.collection('coffee-beans');
    let result = await coll.add(incoming);
    //console.log("okay since you asked", incoming);
    return result;
}
