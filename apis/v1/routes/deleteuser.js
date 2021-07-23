const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["admin"];
module.exports = (channel, msg) => req(channel, msg, deleteuser);

const deleteuser = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  if (authorization.includes(jsondata.role)) {
    const id = content.userid;
    pool.query(
      "DELETE FROM userdata WHERE userid = $1",
      [id],
      (err, results) => {
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
          pool.query(
            "DELETE FROM tokendata WHERE userid = $1",
            [id],
            (err, res) => {
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
                const r = { success: `User deleted with ID: ${id}` };
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
        }
      }
    );
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
