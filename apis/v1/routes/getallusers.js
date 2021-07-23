const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["admin"];
module.exports = (channel, msg) => req(channel, msg, getallusers);

const getallusers = (channel, msg, jsondata) => {
  if (authorization.includes(jsondata.role)) {
    pool.query("SELECT * FROM userdata", (err, result) => {
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
    });
  } else {
    const r = { error: "admin access required" };
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
