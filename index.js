require("dotenv").config();
const updateTodoistFromNotion = require('./updateTodoistFromNotion.js');

exports.handler = async (event, context, callback) => {
    let result = null;
    try {
        await updateTodoistFromNotion.update();
    } catch (error) {
        return formatError(error);
    }

    return callback(null, result);
};

function formatError(error) {
    var response = {
        "statusCode": error.statusCode,
        "headers": {
            "Content-Type": "text/plain",
            "x-amzn-ErrorType": error.code
        },
        "isBase64Encoded": false,
        "body": error.code + ": " + error.message
    }
    return response
}