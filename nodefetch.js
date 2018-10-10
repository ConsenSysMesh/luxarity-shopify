const fetch = require('node-fetch');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-west-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

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

fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json')
    .then(res => res.json())
    .then(json => {

    	for(var i = 0; i < json.orders.length; i++){
    		console.log("lineitems: "+json.orders[i].line_items[0].title)
   		
    	}
    	
    }
    );


/*fetch('https://00000000000000000000000000000000:11111111111111111111111111111111@luxarity-test.myshopify.com/admin/orders.json')
    .then(res => res.json())
    .then(json => {

    	for(var i = 0; i < json.orders.length; i++){
    		console.log("send this order id to sqs queue: "+json.orders[i].id)
   			try{
    		sendsqs(json.orders[i].id)
    		}catch(err){
    			console.log("err for "+json.orders[i].id+" "+err)
    		}	
    	}
    	
    }
    );



async function sendsqs(orderid){
	var params = {
		 DelaySeconds: 10,
		 MessageAttributes: {
		  "test": {
		    DataType: "String",
		    StringValue: "sqstest"
		   }
		 },
		 MessageBody: "{ \"orderid\" : \""+orderid+"\" }",
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
*/




