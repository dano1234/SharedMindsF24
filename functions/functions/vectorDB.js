let Firestore = require('@google-cloud/firestore');
let FieldValue = require('@google-cloud/firestore').FieldValue;
const functions = require("firebase-functions");
const admin = require("firebase-admin");

//const { createProxyMiddleware } = require('http-proxy-middleware');
//require('./indexProxy.js')(exports);
admin.initializeApp({
    projectId: 'sharedmindss24'
});


exports.storeVector = functions.https.onRequest(async (request, response) => {
    // functions.logger.info("Hello logs!", { structuredData: true });
    const { prompt } = request.query;
    if (!prompt) {
        response.status(400).send("Bad Request: 'prompt' query parameter is missing.");
        return;
    }
    let back = await storit(prompt);;

    response.status(200).send({ "repsonse": back });
    //});
    //console.log("okay since you asked");
    //const fromOpenAI = askOpenAI(request.query.prompt);
    //console.log(fromOpenAI);
    //response.send(fromOpenAI);
});


async function storit(prompt) {
    const db = new Firestore();
    const coll = db.collection('coffee-beans');
    await coll.add({
        name: prompt,
        description: "Information about the Kahawa coffee beans.",
        embedding_field: FieldValue.vector([1.0, 2.0, 3.0])
    });
    return "done";
}
