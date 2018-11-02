
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

  


//while(true){

    //var fetchUrl = 'https://a2cb93368c968029e8ffdf925ab3f4f6:10d3c4d7bef29c260283452aad702c18@luxarity-test.myshopify.com/admin/orders.json?since_id='+latestOrderId;
    //var fetchUrl = 'https://4ec131b8085501131e65d77fdbf3ad74:1ca008f697f8bc87bd89a45e64604e89@luxarity-popup-2016.myshopify.com/admin/orders.json?ids=775879688235';
    //var fetchUrl = 'https://4ec131b8085501131e65d77fdbf3ad74:1ca008f697f8bc87bd89a45e64604e89@luxarity-popup-2016.myshopify.com/admin/orders.json?since_ids=775879688235';

    async function getDataFromAPItest(fetchUrl) {
        let response = await fetch(fetchUrl)
        let json = await response.json()
        //console.log(JSON.stringify(data, null, "\t"))
        console.log("json length: "+json.orders.length)
        for(var i = 0; i < json.orders.length; i++){
          console.log(json.orders[i].id);
        }
      }


    async function getDataFromAPI(fetchUrl) {
        let response = await fetch(fetchUrl)
        let json = await response.json()
        //console.log(JSON.stringify(data, null, "\t"))
        if(!json.orders.length === 0 && json.orders.length === null){
        try{
        for(var i = 0; i < json.orders.length; i++){
          console.log("i")
          if(!(json.orders[i].id && json.orders[i].total_price && json.orders[i].order_number && json.orders[i].customer)){
                //place holder for std out - possibly dlq
                console.log("order missing attributes: "+json.orders[i].id+" loop number: "+i)
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

                }catch(err){
                    console.log("err for "+json.orders[i].id+" "+err)
                }

            }
         }
       }catch(err){
        console.log("err "+err)
       }
     }else{console.log("no records")}

       return "getDataFromAPI done";
    }

letsgo();
async function letsgo(){

var x = 0;
while(true){
    
    var latestOrder = await getLastOrderId();
    console.log("latestOrder: "+latestOrder)
    var fetchUrl = 'https://4ec131b8085501131e65d77fdbf3ad74:1ca008f697f8bc87bd89a45e64604e89@luxarity-popup-2016.myshopify.com/admin/orders.json?since_id='+latestOrder.toString();
    console.log("fetchUrl: "+fetchUrl)
    await getDataFromAPI(fetchUrl)
    console.log("x: "+x)
    x++
    sleep.sleep(30)
    }
    


}

async function getLastOrderId() {

  console.log("inside getLastOrderId : ");



  const client = new Client({
      host     : "luxarity.cijmyc3a39cj.us-east-1.rds.amazonaws.com",
      database     : "lux",
      user : "b4siga",
      password : "Social1mp4ct",
      port     : "5432"
    })

  const query = {
    name: 'getLastOrderId',
    text: "select max(orderid) from orders_prod",
    values: []
  }

    try {
      console.log("inside client.connect try");
        await client.connect();
        const res = await client.query(query);
        if(res.rows === undefined || res.rows.length == 0){
          throw new Error('no rows returned');
        }else{
          console.log("res.rows: "+res.rows)
          return res.rows[0].max;
        }
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }

  };


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
     //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
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

    //}

 
