import {GrubhubExtractor} from "./grubhub-extractor";
import {Database} from "./database";

const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

Db.init_client().then(() => {
  const col = Db.get_collection('places', 'grubhub')
  const test = new GrubhubExtractor({lon: -84.38798523, lat: 33.74899673}, col, 500);
  test.getAllDetailedRestaurants();
});
