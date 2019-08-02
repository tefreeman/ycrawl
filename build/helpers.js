"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("cheerio");
var Helpers = /** @class */ (function () {
    function Helpers() {
    }
    Helpers.buildYelpMenuUrl = function (baseUrl, bizUrl) {
        var url = bizUrl.replace("/biz/", "");
        var cutIndex = url.split('?');
        url = cutIndex[0];
        return baseUrl + "/menu/" + url;
    };
    Helpers.get_prop = function (path, obj) {
        var keys = path.split('.');
        var obj_ptr = obj;
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            obj_ptr = obj_ptr[key];
        }
        return obj_ptr;
    };
    Helpers.textCleaner = function (text) {
        return text.replace(/( {2,})|([\n\t\r\f])/g, '').toLowerCase();
    };
    // Distance in meters
    Helpers.resturants_near = function (lon, lat, maxDist, minDist, col) {
        return col.find({
            "location.coordinates": {
                $near: {
                    $geometry: {
                        type: "Point", coordinates: [lon, lat]
                    },
                    $minDistance: minDist,
                    $maxDistance: maxDist,
                }
            }
        }).toArray();
    };
    Helpers.extractList2D = function (page, selectorContent, selectorName, selectorValue, nameAvoidClass, valueAvoidClass, nameHasClass, valueHasClass) {
        if (nameAvoidClass === void 0) { nameAvoidClass = ""; }
        if (valueAvoidClass === void 0) { valueAvoidClass = ""; }
        if (nameHasClass === void 0) { nameHasClass = ""; }
        if (valueHasClass === void 0) { valueHasClass = ""; }
        var arr = [];
        try {
            var sideBar_1 = cheerio.load(page(selectorContent).html());
            var offset_1 = 0;
            sideBar_1(selectorName).each(function (i, ele) {
                try {
                    var node = sideBar_1(this);
                    var text = node.text();
                    if (!node.hasClass(nameAvoidClass)) {
                        if (nameHasClass === "" || node.hasClass(nameHasClass)) {
                            if (arr[i - offset_1] == undefined) {
                                arr[i - offset_1] = {};
                            }
                            arr[i - offset_1].name = Helpers.textCleaner(text);
                        }
                        else {
                            offset_1++;
                        }
                    }
                    else {
                        offset_1++;
                    }
                }
                catch (_a) {
                }
            });
            offset_1 = 0;
            sideBar_1(selectorValue).each(function (i, ele) {
                try {
                    var node = sideBar_1(this);
                    var text = node.text();
                    if (!node.hasClass(valueAvoidClass)) {
                        if (valueHasClass === "" || node.hasClass(valueHasClass)) {
                            if (arr[i - offset_1] == undefined) {
                                arr[i - offset_1] = {};
                            }
                            arr[i - offset_1].value = Helpers.textCleaner(text);
                        }
                        else {
                            offset_1++;
                        }
                    }
                    else {
                        offset_1++;
                    }
                }
                catch (_a) {
                }
            });
        }
        catch (_a) {
        }
        return arr;
    };
    Helpers.extractList = function (page, selectorContent, selectorArr) {
        var arr = [];
        try {
            var content_1 = cheerio.load(page(selectorContent).html());
            return arr;
            var _loop_1 = function (selector) {
                try {
                    var offset_2 = 0;
                    content_1(selector.selectorName).each(function (i, ele) {
                        var node = content_1(this);
                        var text = node.text();
                        var passedChecks = true;
                        if (selector.hasAttr.length !== 0) {
                            if (!(node.attr(selector.hasAttr[0]) === selector.hasAttr[1])) {
                                passedChecks = false;
                            }
                        }
                        if (node.hasClass(selector.avoidClass)) {
                            passedChecks = false;
                        }
                        if (selector.hasClass !== "" && !node.hasClass(selector.hasClass)) {
                            passedChecks = false;
                        }
                        if (passedChecks) {
                            if (arr[i - offset_2] == undefined) {
                                arr[i - offset_2] = {};
                            }
                            if (selector.type === 'text') {
                                arr[i - offset_2][selector.name] = Helpers.textCleaner(text);
                            }
                            else if (selector.type === 'attr') {
                                arr[i - offset_2][selector.name] = Helpers.textCleaner(node.attr(selector.typeName));
                            }
                        }
                        else {
                            offset_2++;
                        }
                    });
                }
                catch (e) {
                }
            };
            for (var _i = 0, selectorArr_1 = selectorArr; _i < selectorArr_1.length; _i++) {
                var selector = selectorArr_1[_i];
                _loop_1(selector);
            }
            return arr;
        }
        catch (_a) {
            return arr;
        }
    };
    return Helpers;
}());
exports.Helpers = Helpers;
//# sourceMappingURL=helpers.js.map