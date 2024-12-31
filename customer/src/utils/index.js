const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib");

const {
  APP_SECRET,
  BASE_URL,
  EXCHANGE_NAME,
  MSG_QUEUE_URL,
  MESSAGE_BROKER_URL,
  QUEUE_NAME,
  CUSTOMER_BINDING_KEY

} = require("../config");
//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};



/************************message broker************************/

//create channel
module.exports.CreateChannel = async() =>{
  try{
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(EXCHANGE_NAME,"direct",false)
    return channel;
  }catch(err){
    throw err;
  }
}




//subscribe message
module.exports.SubscribeMessage = async (channel,service)=>{
  const appQueue = await channel.assertQueue(QUEUE_NAME);
  channel.bindQueue(appQueue.queue,EXCHANGE_NAME,CUSTOMER_BINDING_KEY);
  channel.consume(appQueue.queue,data =>{
    console.log("\n received data  in customer subscribe message =>\n");
    console.log(data.content.toString());
    service.SubscribeEvents(data.content.toString())
    channel.ack(data);
  })
}