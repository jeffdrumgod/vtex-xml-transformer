"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = __importDefault(require("url"));
var RequestHandler = function (req, res) {
    var _a;
    var urlParsed = url_1.default.parse((_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : "", true);
    var queryObject = urlParsed.query;
    if (req.method !== "GET" ||
        !["/xml-parse", "/status"].includes((urlParsed === null || urlParsed === void 0 ? void 0 : urlParsed.pathname) || "")) {
        res.statusCode = 404;
        res.end("Method or end-point not allowed");
        return;
    }
    if ((urlParsed === null || urlParsed === void 0 ? void 0 : urlParsed.pathname) === "/status") {
        res.statusCode = 200;
        res.end("ok");
        return;
    }
    if ((urlParsed === null || urlParsed === void 0 ? void 0 : urlParsed.pathname) === "/xml-parse") {
        var requiredParams = [
            "storeDomain",
            "storeName",
            "xmlName",
            "regionId",
            "salesChannel",
        ];
        for (var _i = 0, requiredParams_1 = requiredParams; _i < requiredParams_1.length; _i++) {
            var param = requiredParams_1[_i];
            if (!queryObject[param]) {
                res.statusCode = 400;
                res.end("Missing required parameter: ".concat(param));
                return;
            }
        }
    }
    // req.pipe(res);
};
exports.default = RequestHandler;
