const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "userFlip"];

module.exports = (channel, msg) => req(channel, msg, registerDevice);

const nextRechargeDate = (num) => {
  return new Date(new Date().getTime() + num * 24 * 60 * 60 * 1000);
};

const registerDevice = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // checking the authorization of the user
  if (authorization.includes(jsondata.role)) {
    const sql = "SELECT deviceid FROM devicedata WHERE deviceid = $1";
    var role = content.role === "adminClient" ? "userClient" : "userFlip";
    pool.query(sql, [content.deviceID], (err, result) => {
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
        if (result.rowCount === 0) {
          var days = nextRechargeDate(content.days);
          pool.query(
            "INSERT INTO devicedata (deviceid, flipdeviceid, devicetype, nextrecharge, userid, role) values ($1,$2,$3,$4,$5,$6)",
            [
              content.deviceID,
              content.deviceID,
              content.deviceType,
              days,
              content.userid,
              role,
            ],
            (err, results) => {
              if (err) throw err;
              else {
                const r = { success: "Device created successfully" };
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
          const r = { error: "Device already exists" };
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
    });
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
