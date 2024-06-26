
const utils = require('ethers').utils;
const sha256 = require('js-sha256');
var sleep = require('sleep');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const { Client } = require('pg');
var fetch = require('node-fetch');

  
 var i = 0;

while(true){
runeverything()
console.log("sleeping")
  sleep.sleep(10);
  i++;
  }

async function runeverything(){

    console.log("in while : "+i)
    

    try{
    console.log("getting orderid loop: "+i)
     await getorderid()
    }catch(err){
      console.log("getorderid error: "+err)
    }

  async function getorderid(){
    console.log("in getorderid")
    var latestOrderId = await getLastOrderId();
    console.log("latestOrderId: "+latestOrderId)
    if(latestOrderId == null){
      console.log("no new orders")
    }
    //latestOrderId = "775247331371";
    console.log("latestOrderId: "+JSON.stringify(latestOrderId));

    //var fetchUrl = 'https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?since_id='+latestOrderId;
    var fetchUrl = 'https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-popup-2016.myshopify.com/admin/orders.json?since_id='+latestOrderId;
    
    console.log("fetchUrl : "+fetchUrl)
    
    await fetch(fetchUrl)
        .then(res => res.json())
        .then(json => {
          console.log("json: "+json)

            console.log("looping through orders")
          json.forEach(function(order) {
            console.log("json.orders[i].id: "+json.orders[i].id)
              var latestOrderId2 = getLastOrderId();
                    console.log("latestOrderId2: "+latestOrderId2)

                if(!(json.orders[i].id && json.orders[i].total_price && json.orders[i].order_number && json.orders[i].customer)){
                    //place holder for std out - possibly dlq

                    
                    console.log("order missing attributes: "+json.orders[i].id+" loop number: "+i)
                }else if(json.orders.length == 0){
                  console.log("no new orders")
                }else if(latestOrderId === latestOrderId2){
                  console.log("duped order")

                }else{
                    console.log("send this order id to sqs queue: "+json.orders[i].id + " "+json.orders[i].customer.email)


                    var redemptionPin = json.orders[i].id.toString()+json.orders[i].order_number.toString();
                    console.log("redemptionPin: "+redemptionPin)
                    var redemptionPin256reg = sha256(redemptionPin)
                    console.log("redemptionPin256reg: "+redemptionPin256reg)
                    var redemptionPin256 = redemptionPin256reg.toUpperCase()

                    
                    var customerEmail256reg = sha256(json.orders[i].customer.email)
                    var customerEmail256 = customerEmail256reg.toUpperCase()

                    var ipfsURL = 'ipfs_not_generated';
                    
                    try{
                     sendsqs(ipfsURL, json.orders[i].id, json.orders[i].total_price, json.orders[i].order_number, customerEmail256, json.orders[i].customer.email, redemptionPin256);
                     console.log("send sqs")
                    }catch(err){
                        console.log("err for "+json.orders[i].id+" "+err)
                    }

                      }

                  
                });
                
          }).catch(err => console.log("fetch error: "+err))

        sleep.sleep(5)

    }

  async function getLastOrderId() {

    var client = new Client({
      host     : "luxarity.cijmyc3a39cj.us-east-1.rds.amazonaws.com",
      database     : "lux",
      user : "b4siga",
      password : "Social1mp4ct",
      port     : "5432"
    })

    //client = await connectclient(client);

    try{
      client.connect()
    }catch(err){
      console.log("client connect error")
    }

    console.log("inside getLastOrderId : ");

    var query = {
      name: 'getLastOrderId'+i,
      text: "select max(orderid) from orders",
      values: []
    }

    console.log("query: "+query.toString())

      try {
        console.log("inside client.connect try");
          
          var res = await client.query(query);
          console.log("after client.query")

          if(res.rows === undefined || res.rows.length == 0){
            console.log("error in query")
            throw new Error('no rows returned');
          }else{
            console.log("res.rows: "+res.rows)
            return res.rows[0].max;
          }
        } catch (e) {
          throw e;
        } finally {
          await client.end();
          console.log("end db")
        }

    };

  async function connectclient(client){ 
  console.log("client connect")
  try{
  await client.connect()
}catch(err){
    console.log("client connect err: "+err)
  }
}


  //add regular customer_email
  async function sendsqs(tokenUri, orderid, total_price, order_number, customer_email_sha256, customerEmail, redemption_pin_sha256){
    var params = {
       DelaySeconds: 10,
       MessageAttributes: {
        "LuxarityOrder": {
          DataType: "String",
          StringValue: "Individual Lux Order for SoldOrderToMint endpoint"
         }
       },
       //MessageBody: "{ \"orderid\" : \""+orderid+"\" , \"total_price\" : \""+total_price+"\" , \"order_number\" : \""+order_number+"\" , \"customer_email\" : \""+customer_email+"\"}",
       MessageBody: "{ \"tokenURI\" : \""+tokenUri+"\", \"totalPrice\" : "+total_price+", \"customerEmailSHA256\" : \""+customer_email_sha256+"\", \"customerEmail\" : \""+customerEmail+"\" , \"orderId\" : "+orderid+", \"orderNumber\" : "+order_number+", \"redemptionPinSHA256\" : \""+redemption_pin_sha256+"\",  \"blockchain\" : \"Rinkeby\" }",
       QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/lux-ebs-test"
       //
       //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
       //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/lux-ebs-test"
       //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
       //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/lux-ebs-test"
       //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
       //QueueUrl: "https://sqs.us-west-1.amazonaws.com/711302153787/SQS_QUEUE_NAME"
      };

          console.log("message body: "+params.MessageBody)
      await sqs.sendMessage(params, function(err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data.MessageId);
        }
      });
  }

  


}
