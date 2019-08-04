import {Database} from "./database";
import {Helpers} from "./helpers";
import {YelpDetailedExtractor} from "./yelp-detailed-extractor";
import {YelpSearchExtractor} from "./yelp-search-extractor";
import {GrubhubExtractor} from "./grubhub-extractor";

const axios = require("axios");


const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

async function run_grubhub(loc: { lon: number, lat: number }) {
  Db.init_client().then(() => {
    const col = Db.get_collection('places', 'grubhub');
    const test = new GrubhubExtractor(loc, col, 500);
  });
}

async function run_yelp() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'yelp');
  const test = new YelpSearchExtractor({
    r_lon: -86.39471041010745,
    r_lat: 33.79718499296451,
    l_lon: -87.21319185541995,
    l_lat: 33.10972274220187
  }, restaurantCol, 1500);
  test.start()
}

async function run_detailed_yelp() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'yelp');

  const restaurants = await Helpers.resturants_near(-86.70478820800781, 33.485290098289475, 5000000, 1, restaurantCol);
  let count = 0;
  for (const restaurant of restaurants) {
    const extractor = new YelpDetailedExtractor(restaurant, 1500);
    restaurant['detailedData'] = await extractor.get_data();
    restaurant['hasDetails'] = true;
    const result = await restaurantCol.replaceOne({_id: restaurant['_id']}, restaurant);

    count += 1;

    console.log('processed: ', count);
  }
}
  run_detailed_yelp().then(() => {
    console.log('done');
  })

