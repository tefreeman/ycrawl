import {Database} from "./database";
import {Helpers} from "./helpers";
import {Extractor} from "./extractor";
import {RExtractor} from "./r-extractor";

const axios = require("axios");


const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

run_yelp();

async function run_yelp() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'new_restaurants');
  const test = new RExtractor("https://www.yelp.com/search/snippet?find_desc=Restaurants&l=g%3A-86.39471041010745%2C33.79718499296451%2C-87.21319185541995%2C33.10972274220187", restaurantCol);
}

async function run() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'old_resturants');
  const restaurants = await Helpers.resturants_near(-86.70478820800781, 33.485290098289475, 5000, 1, restaurantCol);

  for (const restaurant of restaurants) {
    const extractor = new Extractor(restaurant);

    restaurant['menuData'] = await extractor.get_data();
    restaurant['hasMenu'] = true;
    const result = await restaurantCol.replaceOne({_id: restaurant['_id']}, restaurant)
    console.log(result);
  }
}