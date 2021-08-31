const pool = require("../database/model/connect");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "{8367E87C-B794-4A04-89DD-15FE7FDBFF78}";

//----------------login a user---------------//

module.exports = (channel, msg) => {
  // get user data from the queue
  const content = JSON.parse(msg.content.toString());
  const { userid } = content;
  pool.query(
    "SELECT * FROM userdata WHERE userid = $1",
    [userid],
    (error, results) => {
      if (error) {
        throw error;
      } else {
        if (results.rows.length == 0) {
          const r = { error: "Incorrect userid" };
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(r)),
            {
              correlationId: msg.properties.correlationId,
            }
          );
          channel.ack(msg);
        } else {
          const saltedPassword = results.rows[0].password;
          checkSaltPasswordAndUpdateToken(
            channel,
            msg,
            saltedPassword,
            results
          );
        }
      }
    }
  );
};

// function to very if password is correct
async function checkSaltPasswordAndUpdateToken(
  channel,
  msg,
  saltedPassword,
  results
) {
  const content = JSON.parse(msg.content.toString());
  bcrypt.compare(
    content.password,
    saltedPassword,
    function (err, successResult) {
      if (successResult === true) {
        const payLoad = {
          userid: results.rows[0].userid,
          username: results.rows[0].username,
          role: results.rows[0].role,
        };
        const token = jwt.sign(payLoad, JWT_SECRET, {
          algorithm: "HS256",
          expiresIn: 60 * 5,
        });
        // send the result to the queue
        const r = {
          success: "Logged in successfully!",
          tokenid: token,
        };
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
        const r = { error: "Incorrect username or password" };
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

//--------------functions for tokens----------------//

async function randomString() {
  return crypto.randomBytes(64).toString("hex");
}
function sha256(txt) {
  const secret = "abcdefg";
  const hash = crypto.createHmac("sha256", secret).update(txt).digest("hex");
  return hash;
}
