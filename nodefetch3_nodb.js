const fetch = require('node-fetch');
const utils = require('ethers').utils;
const sha256 = require('js-sha256');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const IPFS = require('ipfs');
const fs = require('file-system');


const node = new IPFS();
    try{
    node.on('ready', async () => {
      const version = await node.version()
      console.log("node ready")

      //arn:aws:lambda:us-east-1:711302153787:function:luxarity-lambda-sensui-csi-develop-soldOrderToMint
      //684348276847
      //684348276847
      //https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?since_id=670021091439
      var orderjson = await fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?ids=693655208047')
        .then(res => res.json())

            console.log("calling jsonloop ")
            //jsonLoop(json);
            for(var i = 0; i < orderjson.orders.length; i++){
            console.log("###LOOP NUMBER "+i+"###")
            console.log("orderid: "+orderjson.orders[i].id)

            if(!(orderjson.orders[i].id && orderjson.orders[i].total_price && orderjson.orders[i].order_number && orderjson.orders[i].customer)){
                //place holder for std out - possibly dlq
                console.log("order missing attributes: "+orderjson.orders[i].id+" loop number: "+i)
            }else{
            
            console.log("sending to ipfs")

            let orderMetaData = {
              "buyerId": orderjson.orders[i].customer.email,
              "orderId": orderjson.orders[i].id,
              "orderAmount":  orderjson.orders[i].total_price,
              "vendor": 'Luxarity',
              "dateOfSale": new Date(),
            };
            let orderMdString = JSON.stringify(orderMetaData);
            //let mdHash = sha256(orderMdString);
            let mdHash = utils.solidityKeccak256(['string'], [orderMdString])
            
            

            //fs.writeFile(mdHash + ".json", orderMdString);

            console.log("Waiting for IPFS URL to be generated.");
            //setting up IPFS node
            let ipfsHash;
            let ipfsURL;

            //////////////
            console.log('Version:', version.version);

            const filesAdded = await node.files.add({
              path: mdHash + ".json",
              content: Buffer.from(orderMdString)
            });

            console.log('Added file:', filesAdded[0].path, filesAdded[0].hash);
            ipfsHash = filesAdded[0].hash;

            //const fileBuffer = await node.files.cat(filesAdded[0].hash);

            //console.log('Added file contents:', fileBuffer.toString());

            //let ipfsURL = "https://ipfs.io/ipfs/" + ipfsHash;
            ipfsURL = "https://ipfs.io/ipfs/" + ipfsHash;
            console.log("ipfsURL: "+ipfsURL)

            
            //return ipfsURL;

            var redemptionPin = orderjson.orders[i].id.toString()+orderjson.orders[i].order_number.toString();
            //console.log("remptionPin: "+redemptionPin);
            //var redemptionPin256 = utils.solidityKeccak256(['string'], [redemptionPin])
            var redemptionPin256reg = sha256(redemptionPin)
            var redemptionPin256 = redemptionPin256reg.toUpperCase()
            //var customerEmail256 = utils.solidityKeccak256(['string'], [orderjson.orders[i].customer.email])
            var customerEmail256reg = sha256(orderjson.orders[i].customer.email)
            var customerEmail256 = customerEmail256reg.toUpperCase()

            console.log("sending sqs for: "+orderjson.orders[i].id)
            //console.log("order total_price: "+)
            await sendsqs(ipfsURL, orderjson.orders[i].id, orderjson.orders[i].total_price, orderjson.orders[i].order_number, customerEmail256, orderjson.orders[i].customer.email, redemptionPin256);
            console.log("done");
            /////////////

          }

        }

        node.stop(() => {
         // node is now 'offline'
         console.log("stopping node")
        })
      

    })

   }catch(err){console.log("ipfs on ready error: "+err)}


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
     QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
     //QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/lux-ebs-test"
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




