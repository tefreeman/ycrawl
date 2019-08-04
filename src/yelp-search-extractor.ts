import {Collection} from "mongodb";
import {Helpers} from "./helpers";
import {MaxRequests} from "./max-requests";

const axios = require('axios');

export class YelpSearchExtractor {

  private urlCoords = [];
  private baseUrl = "https://www.yelp.com/search";
  private keys = new Set();
  private MaxReq: MaxRequests;

  constructor(private coords: { l_lon: number, l_lat: number, r_lon: number, r_lat: number }, private saveToCol: Collection, maxReqPerHour: number) {
    this.urlCoords.push(coords);
    this.MaxReq = new MaxRequests(maxReqPerHour);
  }

  async start() {
    await this.addkeys('id');
    while (this.urlCoords.length > 0) {
      const coords = this.urlCoords[0];

      const result = await this.processAll(this.urlQueryBuilder(coords));
      if (result === 'split') {
        const newCoords = this.splitCoords(coords);
        this.urlCoords.splice(0, 1, newCoords[0], newCoords[1]);
      } else if (result === 'done') {
        this.urlCoords.shift();
      }
    }
return
  }

  async processAll(url: string) {
    let pageNum = 0;
    while (true) {
      const val = await this.processUrl(url, pageNum);
      if (val === -1) {
        console.log('processed: ', (pageNum) + val, ' restaurants');
        return 'done';
      } else {
        // results is over 1000 -> split into two coords query
        if (val === -2) {
          return 'split';
        }
      }

      pageNum += 30;
      console.log(pageNum);
    }
  }

  async processUrl(url: string, num: number) {
    let page = await this.getPage(url, num);
    const data = page.data;

    try {
      const exception = Helpers.get_prop('searchPageProps.searchExceptionProps.exceptionType', data);

      if (exception === 'excessivePaging') {
        return -1;
      }
    } catch (e) {

    }


    try {
      const paginationInfo = Helpers.get_prop('searchPageProps.searchResultsProps.paginationInfo', data);
      console.log(paginationInfo['totalResults']);
      if (paginationInfo['totalResults'] > 990) {
        return -2;
      }
      const mapProps = Helpers.get_prop('searchPageProps.searchMapProps.mapState.markers', data);
      const biz = Helpers.get_prop('searchPageProps.searchResultsProps.searchResults', data);


      const filtredBiz = this.filterBusinesses(biz);

      const bizJson = this.merge_markers_with_biz(filtredBiz, mapProps);
      const len = bizJson.length;
      bizJson.filter((r) => {
        return !this.keys.has(r['id'])
      });

      bizJson.forEach((r) => {
        r['hasDetails'] = false;
      });

      console.log('Yelp: inserted: ', bizJson.length, ' ', len - bizJson.length, 'duplicates not added')
      return this.saveToCol.insertMany(bizJson).then(() => {
        return len;
      })

    } catch (e) {
      console.log(e);
      return -1;
    }
  }

  async getPage(url: string, pageNum: number) {
    const done = await this.MaxReq.waitTillReady();
    if (pageNum > 0) {
      return await axios.get(url + "&start=" + pageNum.toString());
    } else {
      return await axios.get(url);
    }


  }

  private async addkeys(prop: string) {
    return this.saveToCol.find({}).forEach((restaurant) => {
      this.keys.add(restaurant[prop])
    }).then(() => {
      return;
    })
  }

  private splitCoords(coords: { l_lon: number, l_lat: number, r_lon: number, r_lat: number }) {
    const midLon = (coords.l_lon - coords.r_lon) / 2;
    const coords1 = {
      r_lon: coords.r_lon,
      r_lat: coords.r_lat,
      l_lon: coords.r_lon + midLon,
      l_lat: coords.l_lat,
    };
    const coords2 = {
      r_lon: coords.r_lon + midLon,
      r_lat: coords.r_lat,
      l_lon: coords.l_lon,
      l_lat: coords.l_lat
    };

    return [coords1, coords2];
  }

  private urlQueryBuilder(coords: { l_lon: number, l_lat: number, r_lon: number, r_lat: number }) {
    let coordString = encodeURIComponent('g:' + coords.r_lon.toString() + ',' + coords.r_lat.toString()
      + ',' + coords.l_lon.toString() + ',' + coords.l_lat.toString());
    return this.baseUrl + '/snippet?' + 'find_desc=Restaurants' + '&l=' + coordString;

  }

  private merge_markers_with_biz(bizs: any[], mapProps: any[]) {
    const biz_key_tree = {};
    for (const biz of bizs) {
      biz_key_tree[biz['bizId']] = biz['searchResultBusiness'];
      biz_key_tree[biz['bizId']]['id'] = biz['bizId'];
      biz_key_tree[biz['bizId']]['tags'] = biz['tags'];
    }

    for (const mapProp of mapProps) {
      if (biz_key_tree.hasOwnProperty(mapProp['resourceId'])) {
        biz_key_tree[mapProp['resourceId']]['location'] = {'coordinates': [mapProp['location']['longitude'], mapProp['location']['latitude']]};
        biz_key_tree[mapProp['resourceId']]['mUrl'] = mapProp['url'];
      }
    }

    return Object.values(biz_key_tree);
  }

  private filterBusinesses(arr: any[]) {
    return arr.filter((val) => {
      return val.hasOwnProperty('bizId') && !val['searchResultBusiness']['isAd']
    })
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
