const pool = require("../database/model/connect");
const req = require("../functions/request");
const bcrypt = require("bcrypt");
const authorization = ["admin"];

module.exports = (channel, msg) => req(channel, msg, registerUser);

const registerUser = (channel, msg, jsondata) => {
  const content = JSON.parse(msg.content.toString());
  // checking the authorization of the user
  if (authorization.includes(jsondata.role)) {
    const sql = "SELECT userid FROM userdata WHERE userid = $1";
    pool.query(sql, [content.userid], (err, result) => {
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
          hashPasswordAndInsertUserInDB(channel, msg);
        } else {
          // send the result to the queue
          const r = { error: "User already exists" };
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

// function to hash the user's password
async function hashPasswordAndInsertUserInDB(channel, msg) {
  const content = JSON.parse(msg.content.toString());
  try {
    const hash = await bcrypt.hash(content.password, 10);
    insertUserIntoUserdata(channel, msg, hash);
  } catch (error) {
    throw error;
  }
}

async function insertUserIntoUserdata(channel, msg, hash) {
  // getting user info from the queue
  const content = JSON.parse(msg.content.toString());
  // inserting user info into the db
  pool.query(
    "INSERT INTO userdata (userid, username, password, role) values ($1,$2,$3,$4)",
    [content.userid, content.username, hash, "user"],
    (err, results) => {
      if (err) throw err;
      else {
        insetUserinTokendata(channel, msg);
      }
    }
  );
}

async function insetUserinTokendata(channel, msg) {
  // getting token info from the queue
  const content = JSON.parse(msg.content.toString());
  // inserting token info into the db
  pool.query(
    "INSERT INTO tokendata (userid, tokenid) values ($1,$2)",
    [content.userid, null],
    (err, results) => {
      if (err) throw err;
      else {
        // send the result to the queue
        const r = { success: "User created successfully" };
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
