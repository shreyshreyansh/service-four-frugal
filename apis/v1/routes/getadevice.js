const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "adminFlip"];
module.exports = (channel, msg) => req(channel, msg, getadevice);

const getadevice = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // checking the authorization of the user
  if (
    authorization.includes(jsondata.role) ||
    jsondata.userid === content.userid
  ) {
    // get a particular device from the device table
    pool.query(
      "SELECT * FROM devicedata where deviceid = $1 and userid = $2",
      [content.deviceID, content.userid],
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
    const r = { error: "admin access required or token invalid for the user" };
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
