/* eslint-disable */
const aws = require('aws-sdk');
const sqs = new aws.SQS();
const queueURL = process.env.QUEUE_URL;


exports.handler = async function (event) {
  let data;
  if (event.httpMethod === 'POST') {
    data = JSON.parse(event.body);
  }
  event = data
  if(!event || event.key !== process.env.API_KEY) {
    return "Non maching api key!"
  }

  const stats = {
    userNo: event.message.nonWinnerNo.length + event.message.winners.length,
    tickets: event.message.tickets,
    winnerNo: event.message.winnerTicketsNo,
    winningNumbers: event.message.winningNumbers,
    drawNum: event.message.drawNum,
    drawDate: event.message.drawDate,
  }

  await mapAllSettled(event.message.winners, t => sendMessage(t, true, stats), 10);
  await mapAllSettled(event.message.nonWinners, t => sendMessage(t, false, stats), 10);

  return '{"success": true}';
}

async function sendMessage(to, isWinner, stats) {
  const params = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify({to, isWinner, stats}),
    QueueUrl: queueURL
  };

  return sqs.sendMessage(params).promise()
}

//https://codeburst.io/async-map-with-limited-parallelism-in-node-js-2b91bd47af70
const { promisify } = require('util')
const { setImmediate } = require('timers')

const setImmediateP = promisify(setImmediate)

async function mapItem(mapFn, currentValue, index, array) {
  try {
    await setImmediateP()
    return {
      status: 'fulfilled',
      value: await mapFn(currentValue, index, array)
    }
  } catch (reason) {
    return {
      status: 'rejected',
      reason
    }
  }
}

async function worker(id, gen, mapFn, result) {
  console.time(`Worker ${id}`)
  for (let [ currentValue, index, array ] of gen) {
    //console.time(`Worker ${id} --- index ${index} item ${currentValue}`)
    result[index] = await mapItem(mapFn, currentValue, index, array)
    //console.timeEnd(`Worker ${id} --- index ${index} item ${currentValue}`)
  }
  console.timeEnd(`Worker ${id}`)
}

function* arrayGenerator(array) {
  for (let index = 0; index < array.length; index++) {
    const currentValue = array[index]
    yield [ currentValue, index, array ]
  }
}

async function mapAllSettled(arr, mapFn, limit = arr.length) {
  const result = []

  if (arr.length === 0) {
    return result
  }

  const gen = arrayGenerator(arr)

  limit = Math.min(limit, arr.length)

  const workers = new Array(limit)
  for (let i = 0; i < limit; i++) {
    workers.push(worker(i, gen, mapFn, result))
  }

  console.log(`Initialized ${limit} workers`)

  await Promise.all(workers)

  return result
}
