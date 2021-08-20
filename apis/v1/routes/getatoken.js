const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "adminFlip"];
module.exports = (channel, msg) => req(channel, msg, getatoken);

const getatoken = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // checking the authorization of the user
  if (
    authorization.includes(jsondata.role) ||
    jsondata.userid === content.userid
  ) {
    // get a particular token from the token table
    var role = jsondata.role === "adminClient" ? "userClient" : "userFlip";
    pool.query(
      "SELECT * FROM tokendata where userid = $1 and role = $2",
      [content.userid, role],
      (err, result) => {
        if (err) {
          // send the result to the queue
          const r = { error: err };
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(r)),
            {
              correlationId: msg.properties.correlationId,
            }
          );
          channel.ack(msg);
        } else {
          // send the result to the queue
          const r = {
            count: Object.keys(result.rows).length,
            result: result.rows,
          };
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(r)),
            {
              correlationId: msg.properties.correlationId,
            }
          );
          channel.ack(msg);
        }
      }
    );
  } else {
    // send the result to the queue
    const r = { error: "admin access required or invalid token id" };
    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(r)),
      {
        correlationId: msg.properties.correlationId,
      }
    );
    channel.ack(msg);
  }
};
