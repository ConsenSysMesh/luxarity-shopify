const fetch = require('node-fetch');
const utils = require('ethers').utils;
const sha256 = require('js-sha256');

const fs = require('fs')
//const csvFilePath='./sally_testcsv3.csv'
const csvFilePath='./csv_sally_volunteer.csv'
const csv=require('csvtojson')
//const csv = require('csv-parser')
//const sleep = require('sleep')

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const { Client } = require('pg');
const { Pool } = require('pg')

const pool = new Pool({
      host     : "luxarity.cijmyc3a39cj.us-east-1.rds.amazonaws.com",
      database     : "lux",
      user : "b4siga",
      password : "Social1mp4ct",
      port     : "5432"
    })

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

var sleep = require('sleep');



getorderid()

async function getorderid(){

csv().fromFile(csvFilePath)
.subscribe((json)=>{
    return new Promise((resolve,reject)=>{
        // Async operation on the json
        // dont forget to call resolve and reject
        if(json.Name){
          var name = json.Name.slice(1)
          //console.log(json["Financial Status"]);
          //{"0":"0","Name":"#2040","Email":"tigger@fildes.com","Financial Status":"paid","Paid at":"2018-11-02 17:00:02 +0800",
          //"Fulfillment Status":"fulfilled","Subtotal":"1250","Total":"1250","Discount Code":""}
         // ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount
          
            //sleep.sleep(1);
            preInsertTmpOrder(name, json.Email, json["Financial Status"], json["Paid at"], json["Fulfillment Status"], json.Subtotal, json.Total, json["Discount Code"])
          
          resolve();
        }else{
          reject()
        }
    })
})


}



 async function preInsertTmpOrder(ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount){

     await insertTmpOrder(ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount)
    console.log("done insertTmpOrder: "+ordernumber)
  }

  async function insertTmpOrder(ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount) {

  console.log("inside insertTmpOrder : "+ordernumber);

  /*const client = new Client({
      host     : "luxarity.cijmyc3a39cj.us-east-1.rds.amazonaws.com",
      database     : "lux",
      user : "b4siga",
      password : "Social1mp4ct",
      port     : "5432"
    })*/
  

  const query = {
    name: 'insertTmpOrder',
    text: "insert into sallyorders (ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,\'volunteer\')",
    values: [ordernumber, email, financialstatus, paidat, fullfillmentstatus, subtotal, total, discountamount]
  }

    /*try {
      console.log("inside client.connect try");
        await client.connect();
        const res = await client.query(query);
        if(res.rows === undefined || res.rows.length == 0){
          //throw new Error('no rows returned');
        }else{
          console.log("res.rows: "+res.rows)
          return res.rows[0].max;
        }
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }*/

      pool.connect((err, client, done) => {
      if (err) throw err
      client.query(query, (err, res) => {
        done()

        if (err) {
          console.log(err.stack)
        } else {
          console.log(res.rows[0])
        }
      })
    })

  };







