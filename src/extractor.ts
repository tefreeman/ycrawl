import * as cheerio from "cheerio"
import {Helpers} from "./helpers";
import {Menu} from "./menu";

const axios = require("axios");

export class Extractor {
  baseUrl = "https://yelp.com";
  $ = null;
  menu = new Menu();
  private url = "";

  constructor(private restaurant_doc: any) {
    this.url = Helpers.buildMenuUrl(this.baseUrl, restaurant_doc.businessUrl);
  }

  public async get_data() {
    await this.fetchData(this.url);
    const menus = this.getMenus();

    for (const menuObj of menus) {
      await this.fetchData(menuObj.url);
      const menuSection = this.getMenuSection();

      if (menuSection.length > 0) {
        this.extractMenuData(menuSection, menuObj.name)
      }
    }

    return this.menu;
  }

  private async fetchData(url: string) {
    const result = await axios.get(url);
    this.$ = cheerio.load(result.data);
  };

  private getMenuSection() {
    return this.$('.biz-menu');
  }

  private search_for_class(arr: any[], class_name: string) {
    const r_arr: string[] = [];
    for (const item in arr) {
      try {
        if (item['attribs']['class'] === class_name) {
          r_arr.push(item['attribs']['id'])
        }
      } catch {
        console.log('no class')
      }
    }
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


  private getMenus() {
    const links: any[] = [];
    const menus = this.$('.sub-menus').find('li');

    if (menus.length > 0) {
      for (const menu of menus) {
        const link = menu.find('a');
        if (link.length >= 1) {
          links.push({name: menu.text(), url: link.attr('href')})
        } else {
          links.push({
            name: menu.text(),
            url: Helpers.buildMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + menu.text()
          })
        }
      }
    } else {
      links.push({
        name: "main-menu",
        url: Helpers.buildMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + "main-menu"
      });
    }

    return links;
  }
}
