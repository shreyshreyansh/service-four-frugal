const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "adminFlip"];
module.exports = (channel, msg) => req(channel, msg, deleteuser);

const deleteuser = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // checking the authorization of the user
  if (authorization.includes(jsondata.role)) {
    const id = content.userid;
    // delete the particular user from the db
    var role = jsondata.role === "adminClient" ? "userClient" : "userFlip";
    pool.query(
      "DELETE FROM userdata where userid = $1 and role = $2",
      [id, role],
      (err, results) => {
        if (err) {
          const r = { error: err };
          // send the result to the queue
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
                // send the result to the queue
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
                // send the result to the queue
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
