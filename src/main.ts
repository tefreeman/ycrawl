import {Database} from "./database";
import {Helpers} from "./helpers";
import {YelpDetailedExtractor} from "./yelp-detailed-extractor";
import {YelpSearchExtractor} from "./yelp-search-extractor";

const axios = require("axios");


const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

run_yelp();

async function run_yelp() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'new_restaurants');
  const test = new YelpSearchExtractor({
    r_lon: -86.39471041010745,
    r_lat: 33.79718499296451,
    l_lon: -87.21319185541995,
    l_lat: 33.10972274220187
  }, restaurantCol);
  test.start()
}

async function run() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'new_restaurants');

  const restaurants = await Helpers.resturants_near(-86.70478820800781, 33.485290098289475, 50000, 1, restaurantCol)

  for (const restaurant of restaurants) {
    const extractor = new YelpDetailedExtractor(restaurant);
    restaurant['detailedData'] = await extractor.get_data();

    const result = await restaurantCol.replaceOne({_id: restaurant['_id']}, restaurant);

  }
}
