/* eslint-disable */
/* eslint-disable @typescript-eslint/no-use-before-define,@typescript-eslint/no-var-requires */
import * as functions from 'firebase-functions';
import { RuntimeOptions } from 'firebase-functions/lib/function-configuration';
import axios from 'axios';
import * as jsdom from 'jsdom';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

console.log('asd');
const awsUrl = process.env.AWS || functions.config().aws.url;
const awsKey = process.env.AWS_KEY || functions.config().aws.key;
const discordUrl = process.env.DISCORD || functions.config().discord.url;

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '256MB',
}

interface ReturnedData {
  winningNumbers: number[];
  drawNum: number;
  drawDate: string;
  tickets: number;
  nonWinners: string[];
  winners: string[];
  winnerTicketsNo: number;
  nonWinnerNo: number;
}

exports.scheduledFunctionCrontab = functions
  .region('europe-west2')
  .runWith(runtimeOpts)
  .pubsub
  .schedule('0 15 * * *')
  .timeZone('Europe/Budapest')
  .onRun(fullLogic);

async function fullLogic() {
  // console.log(process.env)
  const draws = await getWinners();
  await Promise.all(draws.map(async draw => {
    const ref = db.collection('draws')
      .doc(String(draw.drawNum))
    const doc = await ref.get()
    if (doc.exists) {
      console.log(`Doc ${draw.drawNum} already found!`)
      return false
    }

    await ref.set(draw)
    const data = await gatherData(draw.winningNumbers)
    const returnData: ReturnedData = { ...data, ...draw }

    await axios.post(discordUrl, {
      embeds: [{
        title: `new draw found sending to aws- ${draw.drawNum} - ${draw.drawDate}`,
      }],
    });
    console.log('Send start to aws!')
    console.time('AWS')

    try {
      await axios.post(awsUrl, {
        key: awsKey,
        message: returnData
      });
      console.timeEnd('AWS')
      await axios.post(discordUrl, {
        embeds: [{
          title: `new draw successfully send - ${draw.drawNum} - ${draw.drawDate}`,
        }],
      });
    } catch (e) {
      console.timeEnd('AWS')
      console.log(e)
      await ref.delete()
      await axios.post(discordUrl, {
        embeds: [{
          title: `new draw failed to send - ${draw.drawNum} - ${draw.drawDate}`,
        }],
      });
    }
    return 0;
  }));

  return draws;
}
interface DataHelper {
  tickets: number;
  nonWinners: string[];
  winners: string[];
  winnerTicketsNo: number;
  nonWinnerNo: number;
}

async function gatherData(winningNumbers: number[]): Promise<DataHelper> {
  console.time('Data gather')
  interface TicketHelper {
    id: number;
    _t: number;
  }
  const ref = db.collection('user_data')
  const docs = await ref.listDocuments()

  const res: DataHelper[] = await Promise.all(docs.map(async (d: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>) => {
    try {
      const user = await admin.auth()
        .getUser(d.id)
      if (user.emailVerified) {
        const doc = await d.get()
        const data = doc.data()
        if (data && data.tickets) {
          const winners = data.tickets.filter((t: TicketHelper) => winningNumbers.indexOf(t.id) > -1)
          if (winners.length > 0) {
            return {
              tickets: data.tickets.length as number,
              winners: [user.email] as string[],
              nonWinners: [] as string[],
              winnerTicketsNo: winners.length as number,
              nonWinnerNo: 0,
            } as DataHelper
          }
          if (typeof data.enableNonWinningEmail !== 'undefined' && !data.enableNonWinningEmail) {
            return {
              tickets: data.tickets.length,
              winners: [],
              nonWinners: [],
              winnerTicketsNo: 0,
              nonWinnerNo: 1,
            } as DataHelper
          }
          return {
            tickets: data.tickets.length,
            winners: [],
            nonWinners: [user.email],
            winnerTicketsNo: 0,
            nonWinnerNo: 1,
          } as DataHelper
        }
      }
      return {
        tickets: 0,
        winners: [],
        nonWinners: [],
        winnerTicketsNo: 0,
        nonWinnerNo: 0,
      } as DataHelper
    } catch (e) {
      // console.log(d.id)
      return {
        tickets: 0,
        winners: [],
        nonWinners: [],
        winnerTicketsNo: 0,
        nonWinnerNo: 0,
      } as DataHelper
    }
  }))

  const out = {
    tickets: 0,
    winners: [] as string[],
    nonWinners: [] as string[],
    winnerTicketsNo: 0,
    nonWinnerNo: 0,
  }
  res.forEach((d: DataHelper) => {
    out.tickets += d.tickets
    out.winnerTicketsNo += d.winnerTicketsNo
    out.nonWinnerNo += d.nonWinnerNo
    out.winners.push(...d.winners)
    out.nonWinners.push(...d.nonWinners)
  })

  console.timeEnd('Data gather')
  return out
}

async function getWinners() {
  const { JSDOM } = jsdom;
  const url = 'https://www.otpbank.hu/portal/hu/Megtakaritas/ForintBetetek/Gepkocsinyeremeny';
  const response = await axios.get(url)
  const dom = new JSDOM(response.data);
  let selectors: Element[] = []
  dom.window.document.querySelectorAll('section.mtxt').forEach((e) => selectors.push(e))
  const out = selectors.map(selector => {
    const prices = [
      ...selector?.querySelectorAll('li') || [],
    ].map((e) => e.textContent);
    const winners = prices.map((e) => {
      const s = e?.split(' ') || '';
      return Number(`${s[0]}${s[1]}`);
    });
    const headers = [
      ...selector?.querySelectorAll('h4') || [],
    ].map((e) => e.textContent);
    // console.log(headers[0])
    // console.log(headers[0].split('–'))
    if (headers && headers.length > 0 && headers[0]) {
      const drawDate = headers[0].split('–')[1].trim(); // '–' is not the same as '-' be careful!
      const drawNum = Number(headers[0].split('.')[0]);
      const ret = {
        drawNum,
        drawDate,
        winningNumbers: winners
      }
      console.log(ret);
      return ret;
    } else {
      return {
        drawNum: 0,
        drawDate: '',
        winningNumbers: [],
      }
    }
  });
  return out.filter(e => e.drawNum > 0)
}

/**
 *
 * TESTING FUNCTIONS!!!!!
 * COMMENT THEM OUT BEFORE DEPLOY AND/OR PUSH
 *
 */

/*
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});

  getWinners().then(w => {
    response.send(JSON.stringify(w));
  });
});

export const test = functions.https.onRequest((request, response) => {
  fullLogic().then((d) => {
    response.send(JSON.stringify(d));
  })
});

export const apiLogger = functions.https.onRequest((request, response) => {
  console.log(
    {
      url: request.url,
      method: request.method,
      body: request.body
    })
  response.send(JSON.stringify("ok"))
});

export const populate = functions.https.onRequest((request, response) => {
  populateDb().then(() => {
    response.send(JSON.stringify("ok"));
  })
});

async function populateDb() {
  const ref = db.collection('user_data')
  const config = {
    headers: {
      "Authorization": "Bearer owner",
    }
  }
  for(let i=0; i<50; i++) {
    let arr = []
    for(let j=0; j<100; j++) {
      arr.push({id: i*1000 + j, _t: 0})
    }
    try {
      const res = await axios.post("http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/car-prize-notifier/accounts",
        {
          "displayName": "",
          "photoUrl": "",
          "customAttributes": "",
          "email": `${i}-test@test.test`,
          "password": "123456",
          "phoneNumber": ""
        },
        config
      );
      await ref.doc(res.data.localId)
        .set({
          tickets: arr
        })
      if(i < 45) {
        const validationLink = await admin.auth().generateEmailVerificationLink(`${i}-test@test.test`)
        await axios.get(validationLink)
      }
    } catch (e) {
      console.log(e)
    }

  }
}

*/
