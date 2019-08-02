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

  constructor(private location: { lon: number, lat: number }, private bizCol: Collection, maxReqPerHour) {
    this.maxRequest = new MaxRequests(maxReqPerHour)
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
    const headers = this.getHeaderConfig();
    const restaurants = await this.bizCol.find({'hasDetails': false}).toArray()

    let count = 0;
    for (const restaurant of restaurants) {
      const baseRestaurantUrl = GrubhubExtractor.baseDetailedUrl + restaurant['restaurant_id'] + '?';
      const url = GrubhubExtractor.createUrl(baseRestaurantUrl, GrubhubExtractor.detailedParamObj,
        this.location);

      restaurant['details'] = (await this.getSearchResults(url, headers)).data;
      restaurant.hasDetails = true;
      this.bizCol.replaceOne({_id: restaurant['_id']}, restaurant);
      count++;
      console.log('processed: ', count);
    }
  }

  public async getAllRestaurants() {
    const headers = this.getHeaderConfig();
    const baseUrl = GrubhubExtractor.createUrl(
      GrubhubExtractor.baseSearchUrl, GrubhubExtractor.searchParamObj, this.location
    );

    const result = (await this.getSearchResults(baseUrl, headers)).data;

    const totalPages = Helpers.get_prop('search_result.pager.total_pages', result);
    const restaurants = Helpers.get_prop('search_result.results', result);

    for (const r of restaurants) {
      r['hasDetails'] = false;
    }

    this.bizCol.insertMany(restaurants);

    for (let i = 2; i <= totalPages; i++) {
      const urlWithPage = baseUrl + '&pageNum=' + i.toString();
      const result = (await this.getSearchResults(urlWithPage, headers)).data;
      const restaurants = Helpers.get_prop('search_result.results', result);

      for (const r of restaurants) {
        r['hasDetails'] = false;
      }
      this.bizCol.insertMany(restaurants);
    }

  }

  private async getSearchResults(url: string, config = {}) {
    const rdy = await this.maxRequest.waitTillReady();
    return await axios.get(url, config);
  }

  private getHeaderConfig() {
    return {
      headers: {
        Authorization: 'Bearer 27149082-4639-4cec-b855-b6c0c14ae359',
        Accept: 'application/json',
        Origin: 'https://www.grubhub.com'
      }
    }
  }
}
