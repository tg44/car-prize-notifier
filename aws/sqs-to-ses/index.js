/* eslint-disable */
const templates = require('emailtemplate.js');
const aws = require('aws-sdk');
const ses = new aws.SES({region: process.env.AWS_REGION});
const { performance } = require('perf_hooks');
const sqs = new aws.SQS();
const queueURL = process.env.QUEUE_URL;
const nonsend = process.env.NON_SEND === "true";

const params = {
  AttributeNames: [
    "SentTimestamp"
  ],
  MaxNumberOfMessages: 10,
  MessageAttributeNames: [
    "All"
  ],
  QueueUrl: queueURL,
  VisibilityTimeout: 50,
  WaitTimeSeconds: 0
};

const delay = (duration) =>
  new Promise(resolve => setTimeout(resolve, duration));

exports.handler = async function (event) {
  const start = performance.now()
  let nextRound = true
  let pqRes = true
  let elaspedMs = 0;

  while(nextRound) {
    pqRes = await processTheQueue()
    elaspedMs = performance.now() - start
    nextRound = pqRes && elaspedMs < 40*1000
  }

  if(!pqRes) {
    return "No more elements!"
  }
  return `Finished execution before timeout ${elaspedMs} ms!`
}

async function processTheQueue() {
  try {
    const start = performance.now()
    const data = await sqs.receiveMessage(params).promise()
    //console.log(data)
    if (!data.Messages || data.Messages.length === 0) {
      console.log("No more data!")
      return false
    }
    const send = await Promise.all(data.Messages.map(m => processOneMessage(m)))
    const elaspedMs = performance.now() - start
    console.log(`Batch of ${data.Messages.length} processed in ${elaspedMs} ms`)
    if (elaspedMs < 1000) {
      await delay(1000 - elaspedMs);
    }
    return true;
  } catch (e) {
    console.log(e)
    return false
  }
}

async function processOneMessage(message) {
  try {
    const event = JSON.parse(message.Body)
    const send = await sendMail(event.to, event.isWinner, event.stats)
    const deleteParams = {
      QueueUrl: queueURL,
      ReceiptHandle: message.ReceiptHandle
    };
    await sqs.deleteMessage(deleteParams).promise();
  } catch (e) {
    console.log(e)
  }
}

async function sendMail(to, isWinner, stats) {
  const title = isWinner ? `[GNYJ] ${stats.drawNum}. sorsolás értesítő - Nyertél` : `[GNYJ] ${stats.drawNum}. sorsolás értesítő`
  const htmlBody = templates.html(isWinner, stats.userNo, stats.tickets, stats.winnerTicketsNo, stats.winningNumbers)
  const textBody = templates.text(isWinner, stats.userNo, stats.tickets, stats.winnerTicketsNo, stats.winningNumbers)
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlBody
        },
        Text: {
          Charset: "UTF-8",
          Data: textBody
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: title
      }
    },
    Source: '"Gepkocsi nyeremeny" <noreply@tg44.win>',
  };
  if(nonsend){
    console.log(`virtual send to ${to}`)
    return delay(100);
  } else {
    return ses.sendEmail(params).promise();
  }
}
