const fetch = require('node-fetch');
const utils = require('ethers').utils;

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-west-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const IPFS = require('ipfs');
const fs = require('file-system');


//GET /admin/orders.json?since_id=667062206575
//'https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json'
//GET /admin/orders.json?ids=671314968687
//https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?ids=667073937519

fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?ids=667062206575')
    .then(res => res.json())
    .then(json => {

        console.log("calling jsonloop ")
        jsonLoop(json);
    	
    }
    );


async function jsonLoop(json){
  console.log("looping through orders")
      for(var i = 0; i < json.orders.length; i++){
            

            if(!(json.orders[i].id && json.orders[i].total_price && json.orders[i].order_number && json.orders[i].customer)){
                //place holder for std out - possibly dlq
                console.log("order missing attributes: "+json.orders[i].id+" loop number: "+i)
            }else{
                console.log("send this order id to sqs queue: "+json.orders[i].id + " "+json.orders[i].customer.email)
                try{

                //sendsqs(json.orders[i].id, json.orders[i].total_price, json.orders[i].order_number, customerEmail256, redemptionPin256)
                try{
                console.log("sendIpfs before");
                var testurl = await sendIpfs(json.orders[i].customer.email, json.orders[i].id, json.orders[i].total_price, json.orders[i].order_number);
                console.log("sendIpfs after with testurl: "+testurl);
                }catch(err){
                    throw new Error(err)
                }
                //console.log("ihash: "+ihash);

                }catch(err){
                    console.log("err for "+json.orders[i].id+" "+err)
                }

            }

        
      }
}
//add regular customer_email
async function sendsqs(tokenUri, orderid, total_price, order_number, customer_email_sha256, redemption_pin_sha256){
	var params = {
		 DelaySeconds: 10,
		 MessageAttributes: {
		  "LuxarityOrder": {
		    DataType: "String",
		    StringValue: "Individual Lux Order for SoldOrderToMint endpoint"
		   }
		 },
		 //MessageBody: "{ \"orderid\" : \""+orderid+"\" , \"total_price\" : \""+total_price+"\" , \"order_number\" : \""+order_number+"\" , \"customer_email\" : \""+customer_email+"\"}",
		 MessageBody: "{ \"tokenURI\" : \""+tokenUri+"\", \"totalPrice\" : "+total_price+", \"customerEmailSHA256\" : \""+customer_email_sha256+"\", \"orderId\" : "+orderid+", \"orderNumber\" : "+order_number+", \"redemptionPinSHA256\" : \""+redemption_pin_sha256+"\",  \"blockchain\" : \"Rinkeby\" }",
     QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/lux-ebs-test"
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

async function sendIpfs(buyerId, orderId, totalPrice, orderNumber){
    //create IPFS file and link
    let orderMetaData = {
      "buyerId": buyerId,
      "orderId": orderId,
      "orderAmount": totalPrice,
      "vendor": 'Luxarity',
      "dateOfSale": new Date(),
    };
    let orderMdString = JSON.stringify(orderMetaData);
    //let mdHash = sha256(orderMdString);
    let mdHash = utils.solidityKeccak256(['string'], [orderMdString])
    fs.writeFile(mdHash + ".json", orderMdString);

    console.log("Waiting for IPFS URL to be generated.");
    //setting up IPFS node
    let ipfsHash;
    let ipfsURL;
    const node = new IPFS();
    try{
    await node.on('ready', async () => {
      console.log("node on ready")
      const version = await node.version()

      console.log('Version:', version.version);

      const filesAdded = await node.files.add({
        path: mdHash + ".json",
        content: Buffer.from(orderMdString)
      });

      console.log('Added file:', filesAdded[0].path, filesAdded[0].hash);
      ipfsHash = filesAdded[0].hash;

      const fileBuffer = await node.files.cat(filesAdded[0].hash);

      console.log('Added file contents:', fileBuffer.toString());

      //let ipfsURL = "https://ipfs.io/ipfs/" + ipfsHash;
      ipfsURL = "https://ipfs.io/ipfs/" + ipfsHash;
      console.log("ipfsURL: "+ipfsURL)

      
      //return ipfsURL;

      var redemptionPin = orderId.toString()+orderNumber.toString();
      //console.log("remptionPin: "+redemptionPin);
      var redemptionPin256 = utils.solidityKeccak256(['string'], [redemptionPin])
      var customerEmail256 = utils.solidityKeccak256(['string'], [buyerId])

      //await sendsqs(ipfsURL, orderId, totalPrice, orderNumber, customerEmail256, redemptionPin256);
      console.log("done");
       node.stop(() => {
    // node is now 'offline'\
      console.log("stopping ipfs")
      })
      return ipfsURL;
      

    })
  }catch(err){console.log("ipfs node on ready error: "+err)}

    //return ipfsURL;
}


//'{"name" : "Jane Smith", "email" : "jsmith@gmail.com", "password" : "anothergoodpw"}'



//https://www.npmjs.com/package/node-fetch

/*fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json')
    .then(res => res.text())
    .then(body => console.log(body));*/

/*fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json')
    .then(res => res.json())
    .then(json => console.log(json));*/


//id
//total_price
//order_number


