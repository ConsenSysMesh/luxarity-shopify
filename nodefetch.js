const fetch = require('node-fetch');
const utils = require('ethers').utils;

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-west-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});



/*fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json')
    .then(res => res.json())
    .then(json => {

        console.log(json.orders.length)
    	for(var i = 0; i < json.orders.length; i++){
            console.log("###LOOP NUMBER "+i+"###")
            //console.log("id: "+json.orders[i].id)
            //console.log("order_number: "+json.orders[i].order_number)
            //console.log("total price: "+json.orders[i].total_price)
            //console.log("email: "+json.orders[i].email)
            //console.log("fulfillment_status: "+json.orders[i].fulfillment_status)
    		//console.log("lineitems: "+json.orders[i].line_items[0].title)
            if(json.orders[i].customer){
            //console.log("cust: "+JSON.stringify(json.orders[i].customer.email))
            console.log("cust: "+json.orders[i].customer.email)
            }
        
   		   //console.log(json)
    	}
    	
    }
    );*/


//GET /admin/orders.json?since_id=123
//'https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json'
//GET /admin/orders.json?ids=671314968687

fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json?ids=671314968687')
    .then(res => res.json())
    .then(json => {

        console.log("looping through orders")
    	for(var i = 0; i < json.orders.length; i++){
            
            //var order = [];
            //orderid
            //customer.email
            //total_price
            //order_number
            /*if(json.orders[i].customer){
            console.log(json.orders[i].customer.email)
            }else{
                 console.log(json.orders[i].id)
            }*/

            if(!(json.orders[i].id && json.orders[i].total_price && json.orders[i].order_number && json.orders[i].customer)){
                //place holder for std out - possibly dlq
                console.log("order missing attributes: "+json.orders[i].id+" loop number: "+i)
            }else{
                console.log("send this order id to sqs queue: "+json.orders[i].id + " "+json.orders[i].customer.email)
                try{

                //console.log("orderId: "+json.orders[i].id);
                //console.log("orderNumber: "+json.orders[i].order_number);
                var redemptionPin = json.orders[i].id.toString()+json.orders[i].order_number.toString();
                //console.log("remptionPin: "+redemptionPin);
                var redemptionPin256 = utils.solidityKeccak256(['string'], [redemptionPin])
                var customerEmail256 = utils.solidityKeccak256(['string'], [json.orders[i].customer.email])
                //console.log("redemptionPin256: "+redemptionPin256)
                //console.log("customerEmail256: "+customerEmail256)
                //json.orders[i].customer.email

                sendsqs(json.orders[i].id, json.orders[i].total_price, json.orders[i].order_number, customerEmail256, redemptionPin256)
                
                }catch(err){
                    console.log("err for "+json.orders[i].id+" "+err)
                }

            }

    		
    	}
    	
    }
    );

//add regular customer_email
async function sendsqs(orderid, total_price, order_number, customer_email_sha256, redemption_pin_sha256){
	var params = {
		 DelaySeconds: 10,
		 MessageAttributes: {
		  "LuxarityOrder": {
		    DataType: "String",
		    StringValue: "Individual Lux Order for SoldOrderToMint endpoint"
		   }
		 },
		 //MessageBody: "{ \"orderid\" : \""+orderid+"\" , \"total_price\" : \""+total_price+"\" , \"order_number\" : \""+order_number+"\" , \"customer_email\" : \""+customer_email+"\"}",
		 MessageBody: "{ \"tokenURI\" : \""+orderid+"\" , \"totalPrice\" : \""+total_price+"\" , \"customerEmailSHA256\" : \""+customer_email_sha256+"\" , \"orderId\" : \""+orderid+"\" , \"orderNumber\" : \""+order_number+"\" , \"redemptionPinSHA256\" : \""+redemption_pin_sha256+"\" ,  \"blockchain : \"Rinkeby\" }",
         QueueUrl: "https://sqs.us-east-1.amazonaws.com/711302153787/luxarity-orders"
		 //QueueUrl: "https://sqs.us-west-1.amazonaws.com/711302153787/SQS_QUEUE_NAME"
		};

		await sqs.sendMessage(params, function(err, data) {
		  if (err) {
		    console.log("Error", err);
		  } else {
		    console.log("Success", data.MessageId);
		  }
		});
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


