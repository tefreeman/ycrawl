export class Menu {
  public menu = {};
  curMenu = "";
  curSection = "";

  constructor() {
    this.menu['errorCount'] = 0;
    this.menu['errors'] = [];
  }

  private static textCleaner(text: string) {
    return text.replace(/( {2,})|([\n\t\r\f])/g, '').toLowerCase();

  }

  public addError(e) {
    this.menu['errorCount'] += 1;
    this.menu['errors'].push(e);
  }

  public addMenu(name: string) {
    name = Menu.textCleaner(name);
    this.menu[name] = {};
    this.curMenu = name;
  }

  public addSection(section_name: string) {
    section_name = Menu.textCleaner(section_name);
    if (!this.menu[this.curMenu].hasOwnProperty(section_name)) {
      this.menu[this.curMenu][section_name] = {};
      this.menu[this.curMenu][section_name]['info'] = []
    }

    this.curSection = section_name;
  }

  public addInfoToSection(info: string[]) {
    for (const i of info) {
      this.menu[this.curMenu][this.curSection]['info'].push(Menu.textCleaner(i));
    }
  }

  public addItem(name: string, price: string, details: string[]) {
    name = Menu.textCleaner(name);
    price = Menu.textCleaner(price);

    details.forEach((val) => {
      val = Menu.textCleaner(val);
    });
    this.menu[this.curMenu][this.curSection][name] = [];
    this.menu[this.curMenu][this.curSection][name].push({price: price, details: details})
  }

}

