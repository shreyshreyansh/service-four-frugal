const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "adminFlip"];
module.exports = (channel, msg) => req(channel, msg, getallusers);

const getallusers = (channel, msg, jsondata) => {
  // checking the authorization of the user
  if (authorization.includes(jsondata.role)) {
    // get all the users from the db
    var role = jsondata.role === "adminClient" ? "userClient" : "userFlip";
    pool.query(
      "SELECT * FROM userdata where role = $1",
      [role],
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
