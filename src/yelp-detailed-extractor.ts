import * as cheerio from "cheerio"
import {Helpers, ISelector} from "./helpers";
import {Menu} from "./menu";
import {MaxRequests} from "./max-requests";

const axios = require("axios");

export class YelpDetailedExtractor {
  baseUrl = "https://yelp.com";
  menu = new Menu();
  private menuUrl = "";
  private bizUrl = "";
  private MaxReq: MaxRequests;

  constructor(private restaurant_doc: any, maxReqPerHour: number) {
    this.MaxReq = new MaxRequests(maxReqPerHour);
    this.menuUrl = Helpers.buildYelpMenuUrl(this.baseUrl, restaurant_doc.businessUrl);
    this.bizUrl = this.baseUrl + restaurant_doc.businessUrl;

  }

  public async get_data() {
    const bizPage = await this.fetchData(this.bizUrl);
    const bizData = this.extractBizData(bizPage);

    if (bizPage('.menu-explore').length > 0) {
      const menuPage = await this.fetchData(this.menuUrl);
      const menus = this.getMenus(menuPage);
      for (const menuObj of menus) {
        const selectedMenuData = await this.fetchData(menuObj.url);
        const menuSection = this.getMenuSection(selectedMenuData);

        if (menuSection.length > 0) {
          this.extractMenuData(menuSection, menuObj.name)
        }
      }
      bizData['menu'] = this.menu.menu;
    } else if (bizPage('.external-menu').length > 0) {
      bizData['menu'] = bizPage('.external-menu').attr('href');
    } else {
      bizData['menu'] = null;
    }
    return bizData;
  }

  private async fetchData(url: string) {
    await this.MaxReq.waitTillReady();
    const result = await axios.get(url);
    return cheerio.load(result.data);
  };

  private getMenuSection(menuData: CheerioStatic) {
    return menuData('.biz-menu');
  }


  private extractBizData(biz: CheerioStatic) {
    const hours = Helpers.extractList2D(biz, '.sidebar', 'th', 'td', '', 'extra');
    const bizInfo = Helpers.extractList2D(biz, '.sidebar', 'dt', 'dd');
    const ratingDetails = Helpers.extractList2D(biz, '.histogram--large', 'th', 'td', '', '', 'histogram_label', 'histogram_count')
    const reviewSelector: ISelector[] = [
      {
        name: 'stars',
        type: 'attr',
        typeName: 'title',
        selectorName: '.rating-large',
        hasClass: "",
        avoidClass: "",
        hasAttr: []
      },
      {name: 'reviewText', selectorName: 'p', type: 'text', hasClass: '', avoidClass: '', hasAttr: ['lang', 'en']}
    ];
    const reviews = Helpers.extractList(biz, '.review-list', reviewSelector);
    return {hours: hours, bizInfo: bizInfo, ratingDetails: ratingDetails, reviews: reviews}
  }

  private extractMenuData(menu, menu_name: string) {
    const menuSection = menu.find('.menu-sections');
    if (menuSection.length === 0) {
      return
    }

    this.menu.addMenu(menu_name);

    const elementsList = menuSection.children();

    console.log(elementsList);

    for (const element of elementsList) {
      try {
        if (element['attribs']['class'].search("section-header") !== -1) {
          const header = cheerio.load(element);
          const headerEle = header('.alternate');
          const headerInfoEle = header('.menu-section-description').toArray();

          const headerInfo = [];

          for (const info of headerInfoEle) {
            const infoText = cheerio.load(info)('p').text();
            headerInfo.push(infoText);
          }

          const headerText = headerEle.text();

          this.menu.addSection(headerText);
          this.menu.addInfoToSection(headerInfo);

        } else if (element['attribs']['class'].search("u-space-b3") !== -1) {
          const menu = cheerio.load(element);
          const menuItems = menu(".menu-item");
          for (const menuItem of menuItems.toArray()) {
            let details = [];
            const item = cheerio.load(menuItem);

            const itemName = item('h4').text();


            const itemPriceEle = item('.menu-item-price-amount')
            let itemPrice = "";
            if (itemPriceEle.length === 1) {
              itemPrice = itemPriceEle.text();
            }
            const itemDetailsEle = item('.menu-item-details-description');
            let itemDetails: CheerioElement[] = [];
            if (itemDetailsEle.length > 0) {
              itemDetails = itemDetailsEle.toArray();
            }
            for (const detail of itemDetails) {
              const detailTextEle = cheerio.load(detail)('p');
              let detailText = "";
              if (detailTextEle.length > 0) {
                detailText = detailTextEle.text();
              }
              details.push(detailText);
            }

            this.menu.addItem(itemName, itemPrice, details);
            details = []
          }
        }
      } catch (e) {
        console.log('error: ', e);
        this.menu.addError(e);
      }
    }

  }


  private getMenus(menuData: CheerioStatic) {
    const links: any[] = [];
    const menus = menuData('.sub-menus').find('li');

    if (menus.length > 0) {
      // @ts-ignore
      for (const menu of menus) {
        const link = menu.find('a');
        if (link.length >= 1) {
          links.push({name: menu.text(), url: link.attr('href')})
        } else {
          links.push({
            name: menu.text(),
            url: Helpers.buildYelpMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + menu.text()
          })
        }
      }
    } else {
      links.push({
        name: "main-menu",
        url: Helpers.buildYelpMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + "main-menu"
      });
    }

    return links;
  }
}
