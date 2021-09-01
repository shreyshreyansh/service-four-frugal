const e = require("express");
const pool = require("../database/model/connect");
const req = require("../functions/request");
const authorization = ["adminClient", "adminFlip"];
module.exports = (channel, msg) => req(channel, msg, recharge);

const nextRechargeDate = (num, date) => {
  var currTime = new Date().getTime();
  var prevTime = date.getTime();
  var time = Math.max(currTime, prevTime);
  return new Date(time + num * 24 * 60 * 60 * 1000);
};

const recharge = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // find the device in the database
  if (
    authorization.includes(jsondata.role) ||
    (jsondata.role == "userClient" && jsondata.userid == content.userid)
  ) {
    pool.query(
      "SELECT userid, nextrecharge FROM devicedata where deviceid = $1",
      [content.deviceID],
      (err, result) => {
        if (err) {
          const r = { status: err };
          // send the result of device to the queue
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
            const r = { error: "Device does not exist" };
            channel.sendToQueue(
              msg.properties.replyTo,
              Buffer.from(JSON.stringify(r)),
              {
                correlationId: msg.properties.correlationId,
              }
            );
            channel.ack(msg);
          } else {
            if (
              authorization.includes(jsondata.role) ||
              jsondata.userid === result.rows[0].userid
            ) {
              var next = nextRechargeDate(
                content.days,
                result.rows[0].nextrecharge
              );
              pool.query(
                "UPDATE devicedata SET nextrecharge = $1 WHERE deviceid = $2",
                [next, content.deviceID],
                (e, re) => {
                  if (e) {
                    // send the result to the queue
                    const r = { error: e };
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
                      result: `recharge done for device ${content.deviceID} for ${content.days} days`,
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
              const r = {
                error: "admin access required or device not registered",
              };
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
        }
      }
    );
  } else {
    const r = { error: "admin access required or device not registered" };
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
};
