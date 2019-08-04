import {GrubhubExtractor} from "./grubhub-extractor";
import {Database} from "./database";

const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

Db.init_client().then(() => {
  const col = Db.get_collection('places', 'grubhub');
  new GrubhubExtractor({
    lon: -86.83403114318855,
    lat: 33.44113529354669,
  }, col, 4000,);
});
