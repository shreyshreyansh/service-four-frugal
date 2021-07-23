const jwt = require("jsonwebtoken");
const JWT_SECRET = "{8367E87C-B794-4A04-89DD-15FE7FDBFF78}";
module.exports = (channel, msg, cb) => {
  const content = JSON.parse(msg.content.toString());
  validateToken(content.tokenid, JWT_SECRET).then(
    function (result) {
      if (result) cb(channel, msg, result);
      else {
        const r = { error: "token id expired or incorrect" };
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(r)),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
      }
    },
    function (error) {
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(error)),
        {
          correlationId: msg.properties.correlationId,
        }
      );
      channel.ack(msg);
    }
  );
};

async function validateToken(token, secret) {
  try {
    const result = jwt.verify(token, secret);
    return {
      success: "tokenid valid",
      userid: result.userid,
      username: result.username,
      role: result.role,
      iat: result.iat,
      exp: result.exp,
      status: 1,
    };
  } catch (ex) {
    return null;
  }
}
