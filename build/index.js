"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = __importDefault(require("http"));
var fs_1 = __importDefault(require("fs"));
var path_1 = require("path");
var url_1 = __importDefault(require("url"));
var download_1 = __importDefault(require("./download"));
var requestHandler_1 = __importDefault(require("./requestHandler"));
var xmlTransform_1 = __importDefault(require("./xmlTransform"));
var port = 8000;
var getRemoteVtexXml = function (_a) {
    var storeDomain = _a.storeDomain, storeName = _a.storeName, xmlName = _a.xmlName, salesChannel = _a.salesChannel;
    return __awaiter(void 0, void 0, void 0, function () {
        var time, file, savedFile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    time = new Date().getTime();
                    file = (0, path_1.resolve)("./tmp", "".concat(storeName, "-").concat(xmlName, "-").concat(time, ".xml"));
                    return [4 /*yield*/, (0, download_1.default)("https://".concat(storeDomain, "/XMLData/").concat(xmlName, ".xml?sc=").concat(salesChannel), file)];
                case 1:
                    savedFile = _b.sent();
                    return [2 /*return*/, savedFile];
            }
        });
    });
};
var server = http_1.default.createServer(requestHandler_1.default);
var requestCounter = 0;
server.on("request", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, method, url, queryObject, fileName, fileNameTransformed, stat, readStream, err_1;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (res.writableEnded) {
                    return [2 /*return*/];
                }
                headers = req.headers, method = req.method, url = req.url;
                queryObject = url_1.default.parse(url !== null && url !== void 0 ? url : "", true).query;
                requestCounter = requestCounter + 1;
                console.log("Request (".concat(requestCounter, ") - START: ").concat(url));
                _d.label = 1;
            case 1:
                _d.trys.push([1, 4, , 5]);
                return [4 /*yield*/, getRemoteVtexXml(queryObject)];
            case 2:
                fileName = _d.sent();
                return [4 /*yield*/, (0, xmlTransform_1.default)({
                        file: fileName,
                        storeName: ((_a = queryObject === null || queryObject === void 0 ? void 0 : queryObject.storeName) !== null && _a !== void 0 ? _a : ""),
                        regionId: ((_b = queryObject === null || queryObject === void 0 ? void 0 : queryObject.regionId) !== null && _b !== void 0 ? _b : ""),
                        salesChannel: ((_c = queryObject === null || queryObject === void 0 ? void 0 : queryObject.salesChannel) !== null && _c !== void 0 ? _c : ""),
                        complete: !!(queryObject === null || queryObject === void 0 ? void 0 : queryObject.complete),
                    })];
            case 3:
                fileNameTransformed = _d.sent();
                stat = fs_1.default.statSync(fileNameTransformed);
                readStream = fs_1.default.createReadStream(fileNameTransformed);
                readStream.on("open", function () {
                    return res.writeHead(200, {
                        "Content-Type": "text/xml",
                        "Content-Length": stat.size,
                    });
                });
                readStream.pipe(res);
                return [3 /*break*/, 5];
            case 4:
                err_1 = _d.sent();
                res.statusCode = 500;
                res.end("Error");
                console.log(err_1);
                console.log("ERR:", JSON.stringify({
                    headers: headers,
                    method: method,
                    url: url,
                    err: err_1,
                }));
                return [3 /*break*/, 5];
            case 5:
                console.log("Request (".concat(requestCounter, ") - END: ").concat(url));
                return [2 /*return*/];
        }
    });
}); });
server.listen(port, function () {
    console.log("Server up on port ".concat(port));
});
server.timeout = 300000; //  5 minutes
