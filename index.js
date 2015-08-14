import _ from 'lodash';
import packageJSON from './package.json';
import commander from 'commander';
import InfiniteLoop from 'infinite-loop';
import Scrapper from './boligportal/Scrapper';
import { regionToId } from './boligportal/regions';

commander
  .version(packageJSON.version)
  .option('-r, --region [region]', 'Region')
  .option('-m, --email [email]', 'Email')
  .option('-g, --rent <min>..<max>', 'Rent range (in dkk)', (val) => val.split('..').map(Number))
  .option('-z, --zip <zips>', 'Zip codes', (val) => val.split(',').map(Number))
  .option('-t, --types <types>', 'Appartment types', (val) => val.split(','))
  .option('-d, --dry', 'DRY run')
  .parse(process.argv);

const rent = (commander.rent && commander.rent.length === 2) ? commander.rent : [0, 10000];

const opts = {
  region: commander.region ? regionToId(commander.region) : regionToId('copenhagen'),
  email: commander.email,
  rent: {
    min: rent[0],
    max: rent[1]
  },
  zip: commander.zip,
  types: commander.types,
  dry: commander.dry
};

console.info(`${new Date()} ::\nRegion: ${opts.region}\nEmail: ${opts.email}\nRange: ${opts.rent.min}..${opts.rent.max} DKK\nZip codes: ${opts.zip}\nAppartment types: ${opts.types}\n`)

let boligProperties = [];
let firstRun = true;
const scrapper = new Scrapper(opts);
const il = new InfiniteLoop();

// first run, immediately
scrapper.scrap();

il
.add(() => {
  scrapper.scrap();
  console.log(`Waiting for next tick in ${60 * 2 * 1000} ...`);
})
.setInterval(60 * 2 * 1000) // 2 minutes
.run();
