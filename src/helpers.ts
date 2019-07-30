import * as Mongo from "mongodb";

export class Helpers {

  static buildMenuUrl(baseUrl: string, bizUrl: string) {
    let url = bizUrl.replace("/biz/", "");
    let cutIndex = url.split('?');
    url = cutIndex[0];
    return baseUrl + "/menu/" + url
  }

  static get_prop(path: string, obj) {
    const keys = path.split('.');
    let obj_ptr = obj;
    for (const key of keys) {
      obj_ptr = obj_ptr[key];
    }
    return obj_ptr;
  }

  // Distance in meters
  static resturants_near(lon, lat, maxDist, minDist, col: Mongo.Collection) {
    return col.find({
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point", coordinates: [lon, lat]
            },
            $minDistance: minDist,
            $maxDistance: maxDist,
          }
        }
      }
    ).toArray()
  }
}
