import {Collection} from "mongodb";
import {Helpers} from "./helpers";
import {MaxRequests} from "./max-requests";

const axios = require('axios');

export class GrubhubExtractor {
  private static searchParamObj = [
    ['orderMethod', 'delivery'],
    ['locationMode', 'DELIVERY'],
    ['facetSet', 'umamiV2'],
    ['pageSize', '20'],
    ['hideHateos', ' true'],
    ['searchMetrics', ' true'],
    ['facet: open_now', 'true'],
    ['sortSetId', ' umamiV2'],
  ];

  private static detailedParamObj = [
    ['hideChoiceCategories', 'true'],
    ['version', '4'],
    ['orderType', 'standard'],
    ['hideUnavailableMenuItems', 'false'],
    ['hideMenuItems', 'false'],
    ['showMenuItemCoupons', 'false'],
    ['includePromos', 'true'],
    ['locationMode', 'delivery']
  ]
  private static baseDetailedUrl = 'https://api-gtm.grubhub.com/restaurants/';
  private static baseSearchUrl = "https://api-gtm.grubhub.com/restaurants/search?";
  private maxRequest: MaxRequests;
  private keys = new Set();
  private authKey = "";

  constructor(private location: { lon: number, lat: number }, private bizCol: Collection, maxReqPerHour) {
    this.maxRequest = new MaxRequests(maxReqPerHour);
    this.addkeys('restaurant_id').then(() => {
      this.getAuthKey().then((authKey) => {
        this.authKey = authKey;
        this.getAllRestaurants().then((searchNum) => {
          console.log('GrubHub: added ', searchNum, ' restaurants from search');
          this.getAllDetailedRestaurants().then((rNum) => {
            console.log('GrubHub: added ', searchNum, ' detailed restaurants')
          })
        })
      })
    })

  }

  private static createUrl(baseUrl: string, paramObj: string[][], coords: { lon: number, lat: number }) {

    return baseUrl + GrubhubExtractor.createQueryParamsObj(paramObj) + GrubhubExtractor.createLocationQueryPoint(coords)
  }

  private static createLocationQueryPoint(coords: { lon: number, lat: number }) {
    return `&location=POINT(${coords.lon.toString()}%20${coords.lat.toString()})`
  }

  private static createQueryParamsObj(paramObj: string[][]) {
    return new URLSearchParams(paramObj)
  }

  public async getAllDetailedRestaurants() {
    let totalR = 0;
    const headers = this.getHeaderConfig();
    const restaurants = await this.bizCol.find({'hasDetails': false}).toArray()

    for (const restaurant of restaurants) {
      const baseRestaurantUrl = GrubhubExtractor.baseDetailedUrl + restaurant['restaurant_id'] + '?';
      const url = GrubhubExtractor.createUrl(baseRestaurantUrl, GrubhubExtractor.detailedParamObj,
        this.location);

      restaurant['details'] = (await this.getPageData(url, headers)).data;
      restaurant.hasDetails = true;
      this.bizCol.replaceOne({_id: restaurant['_id']}, restaurant);
      totalR++;
      console.log('GrubHub Detailed Processed Restuarant #', totalR);
    }
    return totalR;
  }

  public async getAllRestaurants() {
    let totalSearchSize = 0;
    const headers = this.getHeaderConfig();
    const baseUrl = GrubhubExtractor.createUrl(
      GrubhubExtractor.baseSearchUrl, GrubhubExtractor.searchParamObj, this.location
    );

    const result = (await this.getPageData(baseUrl, headers)).data;

    const totalPages = Helpers.get_prop('search_result.pager.total_pages', result);
    let restaurants = Helpers.get_prop('search_result.results', result);
    restaurants = restaurants.filter((r) => {
      return !this.keys.has(r['restaurant_id'])
    });

    for (const r of restaurants) {
      r['hasDetails'] = false;
    }

    if (restaurants.length > 0) {
      const writeResult = await this.bizCol.insertMany(restaurants);
      totalSearchSize += writeResult.insertedCount;
    }

    for (let i = 2; i <= totalPages; i++) {
      const urlWithPage = baseUrl + '&pageNum=' + i.toString();
      const result = (await this.getPageData(urlWithPage, headers)).data;
      let restaurants = Helpers.get_prop('search_result.results', result);
      restaurants = restaurants.filter((r) => {
        return !this.keys.has(r['restaurant_id'])
      });
      for (const r of restaurants) {
        r['hasDetails'] = false;
      }
      if (restaurants.length > 0) {
        const writeResult = await this.bizCol.insertMany(restaurants);
        totalSearchSize += writeResult.insertedCount;
      }
    }
    return totalSearchSize;
  }

  private async addkeys(prop: string) {
    return this.bizCol.find({}).forEach((restaurant) => {
      this.keys.add(restaurant[prop])
    }).then(() => {
      return;
    })
  }

  private async getAuthKey() {
    const url = "https://api-gtm.grubhub.com/auth";
    const refererUrl = GrubhubExtractor.createUrl(
      GrubhubExtractor.baseSearchUrl, GrubhubExtractor.searchParamObj, this.location
    );
    const headers = {
      'Authorization': 'Bearer',
      'Content-type': 'application/json;charset=UTF-8',
      'Origin': 'https://www.grubhub.com',
      'Referer': refererUrl
    };
    const reqPayload = {
      "brand": "GRUBHUB",
      "client_id": "beta_UmWlpstzQSFmocLy3h1UieYcVST",
      "device_id": 1578039402,
      "scope": "anonymous"
    };
    const authData = (await axios.post(url, reqPayload, headers)).data;
    return "Bearer " + Helpers.get_prop('session_handle.access_token', authData);
  }

  private async getPageData(url: string, config = {}) {
    const rdy = await this.maxRequest.waitTillReady();
    return await axios.get(url, config);
  }

  private getHeaderConfig() {
    return {
      headers: {
        Authorization: this.authKey,
        Accept: 'application/json',
        Origin: 'https://www.grubhub.com'
      }
    }
  }
}
