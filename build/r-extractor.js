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
var helpers_1 = require("./helpers");
var axios = require('axios');
var RExtractor = /** @class */ (function () {
    function RExtractor(coords, saveToCol) {
        this.coords = coords;
        this.saveToCol = saveToCol;
        this.urlCoords = [];
        this.baseUrl = "https://www.yelp.com/search";
        this.urlCoords.push(coords);
    }
    RExtractor.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var coords, result, newCoords;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.urlCoords.length > 0)) return [3 /*break*/, 2];
                        coords = this.urlCoords[0];
                        return [4 /*yield*/, this.processAll(this.urlQueryBuilder(coords))];
                    case 1:
                        result = _a.sent();
                        if (result === 'split') {
                            newCoords = this.splitCoords(coords);
                            this.urlCoords.splice(0, 1, newCoords[0], newCoords[1]);
                        }
                        else if (result === 'done') {
                            this.urlCoords.shift();
                        }
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RExtractor.prototype.processAll = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var pageNum, val;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageNum = 0;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.processUrl(url, pageNum)];
                    case 2:
                        val = _a.sent();
                        if (val === -1) {
                            console.log('processed: ', (pageNum) + val, ' restaurants');
                            return [2 /*return*/, 'done'];
                        }
                        else {
                            // results is over 1000 -> split into two coords query
                            if (val === -2) {
                                return [2 /*return*/, 'split'];
                            }
                        }
                        pageNum += 30;
                        console.log(pageNum);
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RExtractor.prototype.processUrl = function (url, num) {
        return __awaiter(this, void 0, void 0, function () {
            var page, data, exception, paginationInfo, mapProps, biz, filtredBiz, bizJson_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPage(url, num)];
                    case 1:
                        page = _a.sent();
                        data = page.data;
                        try {
                            exception = helpers_1.Helpers.get_prop('searchPageProps.searchExceptionProps.exceptionType', data);
                            if (exception === 'excessivePaging') {
                                return [2 /*return*/, -1];
                            }
                        }
                        catch (e) {
                        }
                        try {
                            paginationInfo = helpers_1.Helpers.get_prop('searchPageProps.searchResultsProps.paginationInfo', data);
                            if (paginationInfo['totalResults'] > 990) {
                                return [2 /*return*/, -2];
                            }
                            mapProps = helpers_1.Helpers.get_prop('searchPageProps.searchMapProps.mapState.markers', data);
                            biz = helpers_1.Helpers.get_prop('searchPageProps.searchResultsProps.searchResults', data);
                            filtredBiz = this.filterBusinesses(biz);
                            bizJson_1 = this.merge_markers_with_biz(filtredBiz, mapProps);
                            return [2 /*return*/, this.saveToCol.insertMany(bizJson_1).then(function () {
                                    return bizJson_1.length;
                                })];
                        }
                        catch (e) {
                            console.log(e);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RExtractor.prototype.getPage = function (url, pageNum) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(pageNum > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, axios.get(url + "&start=" + pageNum.toString())];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, axios.get(url)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RExtractor.prototype.splitCoords = function (coords) {
        var midLon = (coords.l_lon - coords.r_lon) / 2;
        var midLat = (coords.l_lat - coords.r_lat) / 2;
        var coords1 = {
            r_lon: coords.r_lon,
            r_lat: coords.r_lat,
            l_lon: coords.r_lon + midLon,
            l_lat: coords.r_lat + midLat
        };
        var coords2 = {
            r_lon: coords.r_lon + midLon,
            r_lat: coords.r_lat + midLat,
            l_lon: coords.l_lon,
            l_lat: coords.l_lat
        };
        return [coords1, coords2];
    };
    RExtractor.prototype.urlQueryBuilder = function (coords) {
        var coordString = encodeURIComponent('g:' + coords.r_lon.toString() + ',' + coords.r_lat.toString()
            + ',' + coords.l_lon.toString() + ',' + coords.l_lat.toString());
        return this.baseUrl + '/snippet?' + 'find_desc=Restaurants' + '&l=' + coordString;
    };
    RExtractor.prototype.merge_markers_with_biz = function (bizs, mapProps) {
        var biz_key_tree = {};
        for (var _i = 0, bizs_1 = bizs; _i < bizs_1.length; _i++) {
            var biz = bizs_1[_i];
            biz_key_tree[biz['bizId']] = biz['searchResultBusiness'];
            biz_key_tree[biz['bizId']]['id'] = biz['bizId'];
            biz_key_tree[biz['bizId']]['tags'] = biz['tags'];
        }
        for (var _a = 0, mapProps_1 = mapProps; _a < mapProps_1.length; _a++) {
            var mapProp = mapProps_1[_a];
            if (biz_key_tree.hasOwnProperty(mapProp['resourceId'])) {
                biz_key_tree[mapProp['resourceId']]['location'] = { 'coordinates': [mapProp['location']['longitude'], mapProp['location']['latitude']] };
                biz_key_tree[mapProp['resourceId']]['mUrl'] = mapProp['url'];
            }
        }
        return Object.values(biz_key_tree);
    };
    RExtractor.prototype.filterBusinesses = function (arr) {
        return arr.filter(function (val) {
            return val.hasOwnProperty('bizId') && !val['searchResultBusiness']['isAd'];
        });
    };
    return RExtractor;
}());
exports.RExtractor = RExtractor;
function timeout(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
//# sourceMappingURL=r-extractor.js.map