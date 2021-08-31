//packages
const express = require("express");
const bodyParser = require("body-parser");
var amqp = require("amqplib/callback_api");
//functions
const registeruser = require("./apis/v1/routes/registeruser");
const registerdevice = require("./apis/v1/routes/registerdevice");
const getallusers = require("./apis/v1/routes/getallusers");
const getauser = require("./apis/v1/routes/getauser");
const getadevice = require("./apis/v1/routes/getadevice");
const login = require("./apis/v1/routes/login");
const getuserdevices = require("./apis/v1/routes/getuserdevices");
const deleteuser = require("./apis/v1/routes/deleteuser");
const deletedevice = require("./apis/v1/routes/deletedevice");
const istokenvalid = require("./apis/v1/routes/istokenvalid");

//express app
const app = express();

//port
const port = 4000;

//for forms
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//routes
amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = "user_queue";

    channel.assertQueue(queue, {
      durable: false,
    });
    channel.prefetch(1);
    console.log(" [x] Awaiting RPC requests");
    channel.consume(queue, function reply(msg) {
      console.log(" [x] Received %s", JSON.parse(msg.content.toString()));
      msg1 = JSON.parse(msg.content.toString());
      const route = msg1.route;
      // serving functions as per the requests
      switch (route) {
        case "registeruser":
          registeruser(channel, msg);
          break;
        case "registerdevice":
          registerdevice(channel, msg);
          break;
        case "login":
          login(channel, msg);
          break;
        case "getallusers":
          getallusers(channel, msg);
          break;
        case "getauser":
          getauser(channel, msg);
          break;
        case "getuserdevices":
          getuserdevices(channel, msg);
          break;
        case "getdevice":
          getadevice(channel, msg);
          break;
        case "istokenvalid":
          istokenvalid(channel, msg);
          break;
        case "deleteuser":
          deleteuser(channel, msg);
          break;
        case "deletedevice":
          deletedevice(channel, msg);
          break;
        default:
          console.log("Wrong Choice");
      }
    });
  });
});

//listening...
app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
