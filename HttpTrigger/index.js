module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    console.log(JSON.stringify(req, null, 4));
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = JSON.stringify(req, null, 4);
    context.res = {
        body: responseMessage
    };
}