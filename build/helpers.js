"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Helpers = /** @class */ (function () {
    function Helpers() {
    }
    Helpers.buildMenuUrl = function (baseUrl, bizUrl) {
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
    return Helpers;
}());
exports.Helpers = Helpers;
//# sourceMappingURL=helpers.js.map