"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("cheerio");
var helpers_1 = require("./helpers");
var menu_1 = require("./menu");
var axios = require("axios");
var Extractor = /** @class */ (function () {
    function Extractor(restaurant_doc) {
        this.restaurant_doc = restaurant_doc;
        this.baseUrl = "https://yelp.com";
        this.$ = null;
        this.menu = new menu_1.Menu();
        this.url = "";
        this.url = helpers_1.Helpers.buildYelpMenuUrl(this.baseUrl, restaurant_doc.businessUrl);
    }
    Extractor.prototype.get_data = function () {
        return __awaiter(this, void 0, void 0, function () {
            var menus, _i, menus_1, menuObj, menuSection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchData(this.url)];
                    case 1:
                        _a.sent();
                        menus = this.getMenus();
                        _i = 0, menus_1 = menus;
                        _a.label = 2;
                    case 2:
                        if (!(_i < menus_1.length)) return [3 /*break*/, 5];
                        menuObj = menus_1[_i];
                        return [4 /*yield*/, this.fetchData(menuObj.url)];
                    case 3:
                        _a.sent();
                        menuSection = this.getMenuSection();
                        if (menuSection.length > 0) {
                            this.extractMenuData(menuSection, menuObj.name);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, this.menu];
                }
            });
        });
    };
    Extractor.prototype.fetchData = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get(url)];
                    case 1:
                        result = _a.sent();
                        this.$ = cheerio.load(result.data);
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    Extractor.prototype.getMenuSection = function () {
        return this.$('.biz-menu');
    };
    Extractor.prototype.search_for_class = function (arr, class_name) {
        var r_arr = [];
        for (var item in arr) {
            try {
                if (item['attribs']['class'] === class_name) {
                    r_arr.push(item['attribs']['id']);
                }
            }
            catch (_a) {
                console.log('no class');
            }
        }
    };
    Extractor.prototype.extractMenuData = function (menu, menu_name) {
        var menuSection = menu.find('.menu-sections');
        if (menuSection.length === 0) {
            return;
        }
        this.menu.addMenu(menu_name);
        var elementsList = menuSection.children();
        console.log(elementsList);
        for (var _i = 0, elementsList_1 = elementsList; _i < elementsList_1.length; _i++) {
            var element = elementsList_1[_i];
            try {
                if (element['attribs']['class'].search("section-header") !== -1) {
                    var header = cheerio.load(element);
                    var headerEle = header('.alternate');
                    var headerInfoEle = header('.menu-section-description').toArray();
                    var headerInfo = [];
                    for (var _a = 0, headerInfoEle_1 = headerInfoEle; _a < headerInfoEle_1.length; _a++) {
                        var info = headerInfoEle_1[_a];
                        var infoText = cheerio.load(info)('p').text();
                        headerInfo.push(infoText);
                    }
                    var headerText = headerEle.text();
                    this.menu.addSection(headerText);
                    this.menu.addInfoToSection(headerInfo);
                }
                else if (element['attribs']['class'].search("u-space-b3") !== -1) {
                    var menu_2 = cheerio.load(element);
                    var menuItems = menu_2(".menu-item");
                    for (var _b = 0, _c = menuItems.toArray(); _b < _c.length; _b++) {
                        var menuItem = _c[_b];
                        var details = [];
                        var item = cheerio.load(menuItem);
                        var itemName = item('h4').text();
                        var itemPriceEle = item('.menu-item-price-amount');
                        var itemPrice = "";
                        if (itemPriceEle.length === 1) {
                            itemPrice = itemPriceEle.text();
                        }
                        var itemDetailsEle = item('.menu-item-details-description');
                        var itemDetails = [];
                        if (itemDetailsEle.length > 0) {
                            itemDetails = itemDetailsEle.toArray();
                        }
                        for (var _d = 0, itemDetails_1 = itemDetails; _d < itemDetails_1.length; _d++) {
                            var detail = itemDetails_1[_d];
                            var detailTextEle = cheerio.load(detail)('p');
                            var detailText = "";
                            if (detailTextEle.length > 0) {
                                detailText = detailTextEle.text();
                            }
                            details.push(detailText);
                        }
                        this.menu.addItem(itemName, itemPrice, details);
                        details = [];
                    }
                }
            }
            catch (e) {
                console.log('error: ', e);
                this.menu.addError(e);
            }
        }
    };
    Extractor.prototype.getMenus = function () {
        var links = [];
        var menus = this.$('.sub-menus').find('li');
        if (menus.length > 0) {
            for (var _i = 0, menus_2 = menus; _i < menus_2.length; _i++) {
                var menu = menus_2[_i];
                var link = menu.find('a');
                if (link.length >= 1) {
                    links.push({ name: menu.text(), url: link.attr('href') });
                }
                else {
                    links.push({
                        name: menu.text(),
                        url: helpers_1.Helpers.buildYelpMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + menu.text()
                    });
                }
            }
        }
        else {
            links.push({
                name: "main-menu",
                url: helpers_1.Helpers.buildYelpMenuUrl(this.baseUrl, this.restaurant_doc.businessUrl) + "/" + "main-menu"
            });
        }
        return links;
    };
    return Extractor;
}());
exports.Extractor = Extractor;
//# sourceMappingURL=extractor.js.map
