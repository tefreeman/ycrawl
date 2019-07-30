"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Menu = /** @class */ (function () {
    function Menu() {
        this.menu = {};
        this.curMenu = "";
        this.curSection = "";
        this.menu['errorCount'] = 0;
        this.menu['errors'] = [];
    }
    Menu.textCleaner = function (text) {
        return text.replace(/( {2,})|([\n\t\r\f])/g, '').toLowerCase();
    };
    Menu.prototype.addError = function (e) {
        this.menu['errorCount'] += 1;
        this.menu['errors'].push(e);
    };
    Menu.prototype.addMenu = function (name) {
        name = Menu.textCleaner(name);
        this.menu[name] = {};
        this.curMenu = name;
    };
    Menu.prototype.addSection = function (section_name) {
        section_name = Menu.textCleaner(section_name);
        if (!this.menu[this.curMenu].hasOwnProperty(section_name)) {
            this.menu[this.curMenu][section_name] = {};
            this.menu[this.curMenu][section_name]['info'] = [];
        }
        this.curSection = section_name;
    };
    Menu.prototype.addInfoToSection = function (info) {
        for (var _i = 0, info_1 = info; _i < info_1.length; _i++) {
            var i = info_1[_i];
            this.menu[this.curMenu][this.curSection]['info'].push(Menu.textCleaner(i));
        }
    };
    Menu.prototype.addItem = function (name, price, details) {
        name = Menu.textCleaner(name);
        price = Menu.textCleaner(price);
        details.forEach(function (val) {
            val = Menu.textCleaner(val);
        });
        this.menu[this.curMenu][this.curSection][name] = [];
        this.menu[this.curMenu][this.curSection][name].push({ price: price, details: details });
    };
    return Menu;
}());
exports.Menu = Menu;
//# sourceMappingURL=menu.js.map