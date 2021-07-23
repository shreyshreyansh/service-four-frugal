const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["admin"];
module.exports = (channel, msg) => req(channel, msg, getatoken);

const getatoken = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  if (
    authorization.includes(jsondata.role) ||
    jsondata.userid === content.userid
  ) {
    pool.query(
      "SELECT * FROM tokendata where userid = $1",
      [content.userid],
      (err, result) => {
        if (err) {
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
