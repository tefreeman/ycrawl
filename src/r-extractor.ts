import {Collection} from "mongodb";
import {Helpers} from "./helpers";

const axios = require('axios');

export class RExtractor {

  currentPage = 0;

  constructor(private url: string, private saveToCol: Collection) {
    this.processAll()
  }

  async processAll() {
    let pageNum = 0;
    while (true) {
      const val = await this.processUrl(pageNum);
      if (val === -1) {
        console.log('processed: ', (pageNum) + val, ' restaurants');
        break;
      }

      pageNum += 30;
      console.log(pageNum);
    }
  }

  async processUrl(num) {
    let page = await this.getPage(num);
    const data = page.data;

    try {
      const exception = Helpers.get_prop('searchPageProps.searchExceptionProps.exceptionType', data);

      if (exception === 'excessivePaging') {
        return -1;
      }
    } catch (e) {

    }


    try {
      const mapProps = Helpers.get_prop('searchPageProps.searchMapProps.mapState.markers', data);
      const biz = Helpers.get_prop('searchPageProps.searchResultsProps.searchResults', data);


      const filtredBiz = this.filterBusinesses(biz);

      const bizJson = this.merge_markers_with_biz(filtredBiz, mapProps);

      return this.saveToCol.insertMany(bizJson).then(() => {
        return bizJson.length;
      })

    } catch (e) {
      console.log(e);
    }
  }

  async getPage(pageNum) {
    if (pageNum > 0) {
      return await axios.get(this.url + "&start=" + pageNum.toString());
    } else {
      return await axios.get(this.url);
    }


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
