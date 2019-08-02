import * as Mongo from "mongodb";
import * as cheerio from "cheerio";

type tSelector = 'text' | 'attr';

export interface ISelector {
  name: string;
  type: tSelector;
  typeName?: string;
  selectorName: string;
  hasClass: string;
  avoidClass: string;
  hasAttr: string[]
}

export class Helpers {

  static buildYelpMenuUrl(baseUrl: string, bizUrl: string) {
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

  static textCleaner(text: string) {
    return text.replace(/( {2,})|([\n\t\r\f])/g, '').toLowerCase();

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

  static extractList2D(page: CheerioStatic, selectorContent: string, selectorName: string, selectorValue: string,
                       nameAvoidClass: string = "", valueAvoidClass: string = "", nameHasClass: string = "",
                       valueHasClass: string = "") {
    const arr = [];
    try {
      let sideBar = cheerio.load(page(selectorContent).html());

      let offset = 0;

      sideBar(selectorName).each(function (i, ele) {
        try {
          let node = sideBar(this);
          let text = node.text();

          if (!node.hasClass(nameAvoidClass)) {
            if (nameHasClass === "" || node.hasClass(nameHasClass)) {
              if (arr[i - offset] == undefined) {

                arr[i - offset] = {};
              }
              arr[i - offset].name = Helpers.textCleaner(text);
            } else {
              offset++;
            }
          } else {
            offset++;
          }
        } catch {
        }
      });

      offset = 0;
      sideBar(selectorValue).each(function (i, ele) {
        try {
          let node = sideBar(this);
          let text = node.text();

          if (!node.hasClass(valueAvoidClass)) {
            if (valueHasClass === "" || node.hasClass(valueHasClass)) {
              if (arr[i - offset] == undefined) {

                arr[i - offset] = {};
              }
              arr[i - offset].value = Helpers.textCleaner(text);
            } else {
              offset++;
            }
          } else {
            offset++;
          }
        } catch {
        }
      });
    } catch {
    }
    return arr;
  }

  static extractList(page: CheerioStatic, selectorContent: string, selectorArr: ISelector[]) {
    const arr = [];
    try {
      let content = cheerio.load(page(selectorContent).html());
      return arr;
      for (const selector of selectorArr) {
        try {
          let offset = 0;

          content(selector.selectorName).each(function (i, ele) {
            let node = content(this);
            let text = node.text();
            let passedChecks = true;

            if (selector.hasAttr.length !== 0) {
              if (!(node.attr(selector.hasAttr[0]) === selector.hasAttr[1])) {
                passedChecks = false;
              }
            }
            if (node.hasClass(selector.avoidClass)) {
              passedChecks = false;
            }
            if (selector.hasClass !== "" && !node.hasClass(selector.hasClass)) {
              passedChecks = false
            }
            if (passedChecks) {
              if (arr[i - offset] == undefined) {

                arr[i - offset] = {};
              }
              if (selector.type === 'text') {
                arr[i - offset][selector.name] = Helpers.textCleaner(text);
              } else if (selector.type === 'attr') {
                arr[i - offset][selector.name] = Helpers.textCleaner(node.attr(selector.typeName))
              }
            } else {
              offset++;
            }
          });
        } catch (e) {

        }
      }
      return arr;
    } catch {
      return arr;
    }
  }
}
