"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var fast_xml_parser_1 = __importDefault(require("fast-xml-parser"));
var he_1 = __importDefault(require("he"));
var axios_cache_adapter_1 = require("axios-cache-adapter");
var url_1 = require("url");
var api = (0, axios_cache_adapter_1.setup)({
    cache: {
        maxAge: 30 * 60 * 1000,
    },
});
var XmlTransform = function (_a) {
    var storeName = _a.storeName, file = _a.file, regionId = _a.regionId, salesChannel = _a.salesChannel;
    return __awaiter(void 0, void 0, void 0, function () {
        var xmlData, version, optionsDecode, jsonObj, newEntries, skuList_1, chunkSize_1, chunks, productDetails_1, optionsEncode, parser, xml, err_1;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    xmlData = fs_1.default.readFileSync(file, "utf8");
                    version = require("../package.json").version;
                    optionsDecode = {
                        attributeNamePrefix: "@_",
                        attrNodeName: "attr",
                        textNodeName: "#text",
                        ignoreAttributes: true,
                        ignoreNameSpace: false,
                        allowBooleanAttributes: false,
                        parseNodeValue: true,
                        parseAttributeValue: false,
                        trimValues: true,
                        cdataTagName: "__cdata",
                        cdataPositionChar: "\\c",
                        parseTrueNumberOnly: false,
                        numParseOptions: {
                            hex: true,
                            leadingZeros: true,
                            //skipLike: /\+[0-9]{10}/
                        },
                        arrayMode: false,
                        attrValueProcessor: function (val, attrName) {
                            return he_1.default.decode(val, { isAttributeValue: true });
                        },
                        tagValueProcessor: function (val, tagName) { return he_1.default.decode(val); }, //default is a=>a
                        // stopNodes: ["parse-me-as-string"],
                    };
                    if (!(fast_xml_parser_1.default.validate(xmlData) === true)) return [3 /*break*/, 6];
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 5, , 6]);
                    jsonObj = fast_xml_parser_1.default.parse(xmlData, optionsDecode);
                    newEntries = (_b = jsonObj === null || jsonObj === void 0 ? void 0 : jsonObj.feed) === null || _b === void 0 ? void 0 : _b.entry;
                    if (!((_d = (_c = jsonObj === null || jsonObj === void 0 ? void 0 : jsonObj.feed) === null || _c === void 0 ? void 0 : _c.entry) === null || _d === void 0 ? void 0 : _d.length)) return [3 /*break*/, 4];
                    skuList_1 = (_e = jsonObj === null || jsonObj === void 0 ? void 0 : jsonObj.feed) === null || _e === void 0 ? void 0 : _e.entry.map(function (item) { var _a; return (_a = item === null || item === void 0 ? void 0 : item.id) === null || _a === void 0 ? void 0 : _a.__cdata; });
                    chunkSize_1 = 50;
                    chunks = __spreadArray([], Array(Math.ceil(skuList_1.length / chunkSize_1)), true).map(function (_) { return skuList_1.splice(0, chunkSize_1); });
                    return [4 /*yield*/, Promise.all(chunks.map(function (chunk) { return __awaiter(void 0, void 0, void 0, function () {
                            var urlSearch, response;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        urlSearch = "https://".concat(storeName, ".myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&").concat(chunk
                                            .map(function (i) { return "fq=skuId:".concat(i); })
                                            .join("&"));
                                        return [4 /*yield*/, api.get(urlSearch)];
                                    case 1:
                                        response = (_c.sent());
                                        if (!((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.length)) {
                                            return [2 /*return*/, []];
                                        }
                                        return [2 /*return*/, (_b = response.data) === null || _b === void 0 ? void 0 : _b.reduce(function (stack, product) {
                                                return stack.concat(product.items.map(function (sku) {
                                                    var _a, _b, _c;
                                                    var unitMultiplier = sku.unitMultiplier, sellers = sku.sellers, itemId = sku.itemId;
                                                    var seller = sellers === null || sellers === void 0 ? void 0 : sellers.find(function (_a) {
                                                        var sellerDefault = _a.sellerDefault;
                                                        return !!sellerDefault;
                                                    });
                                                    var sale_price = (_a = seller === null || seller === void 0 ? void 0 : seller.commertialOffer) === null || _a === void 0 ? void 0 : _a.Price;
                                                    if (seller) {
                                                        sale_price =
                                                            ((_b = seller === null || seller === void 0 ? void 0 : seller.commertialOffer) === null || _b === void 0 ? void 0 : _b.Price) * +(sku === null || sku === void 0 ? void 0 : sku.unitMultiplier);
                                                        if (!isNaN(sale_price)) {
                                                            sale_price = sale_price.toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL",
                                                            });
                                                        }
                                                        else {
                                                            sale_price =
                                                                (_c = seller === null || seller === void 0 ? void 0 : seller.commertialOffer) === null || _c === void 0 ? void 0 : _c.Price.toLocaleString("pt-BR", {
                                                                    style: "currency",
                                                                    currency: "BRL",
                                                                });
                                                        }
                                                    }
                                                    return {
                                                        itemId: itemId,
                                                        unitMultiplier: unitMultiplier,
                                                        sale_price: sale_price,
                                                    };
                                                }));
                                            }, [])];
                                }
                            });
                        }); }))];
                case 2:
                    productDetails_1 = (_g.sent())
                        .reduce(function (stack, group) {
                        return stack.concat(group);
                    }, [])
                        .reduce(function (stack, item) {
                        var _a;
                        if (item.unitMultiplier !== 1) {
                            Object.assign(stack, (_a = {}, _a[item.itemId] = item, _a));
                        }
                        return stack;
                    }, {});
                    return [4 /*yield*/, Promise.all((_f = jsonObj === null || jsonObj === void 0 ? void 0 : jsonObj.feed) === null || _f === void 0 ? void 0 : _f.entry.map(function (item, index) { return __awaiter(void 0, void 0, void 0, function () {
                            var link, sale_price, id, a;
                            var _a, _b, _c, _d;
                            return __generator(this, function (_e) {
                                link = (_a = item === null || item === void 0 ? void 0 : item.link) === null || _a === void 0 ? void 0 : _a.__cdata;
                                sale_price = (_b = item === null || item === void 0 ? void 0 : item["g:sale_price"]) === null || _b === void 0 ? void 0 : _b.__cdata;
                                id = (_c = item === null || item === void 0 ? void 0 : item.id) === null || _c === void 0 ? void 0 : _c.__cdata;
                                // add new params
                                try {
                                    a = new url_1.URL(link);
                                    // a.searchParams.append("region_id", regionId);
                                    a.searchParams.append("sc", salesChannel);
                                    link = a.toString();
                                }
                                catch (e) {
                                    console.log(e === null || e === void 0 ? void 0 : e.message);
                                }
                                // OMG, this is a hack, but it works
                                // - get details from API
                                // VTEX doesen't have multiplier in XML: https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI
                                // if product exist in list to change value
                                if (productDetails_1.hasOwnProperty("".concat(id))) {
                                    sale_price = productDetails_1["".concat(id)].sale_price;
                                }
                                return [2 /*return*/, __assign(__assign({}, item), { link: {
                                            __cdata: link,
                                        }, region_id: {
                                            __cdata: regionId,
                                        }, "g:sale_price": {
                                            __cdata: sale_price,
                                        }, unitMultiplier: "".concat(((_d = productDetails_1 === null || productDetails_1 === void 0 ? void 0 : productDetails_1["".concat(id)]) === null || _d === void 0 ? void 0 : _d.unitMultiplier) || 1) })];
                            });
                        }); }))];
                case 3:
                    newEntries = _g.sent();
                    _g.label = 4;
                case 4:
                    optionsEncode = {
                        attributeNamePrefix: "@_",
                        attrNodeName: "@",
                        textNodeName: "#text",
                        ignoreAttributes: true,
                        cdataTagName: "__cdata",
                        cdataPositionChar: "\\c",
                        format: false,
                        indentBy: "  ",
                        supressEmptyNode: false,
                        tagValueProcessor: function (a) {
                            return he_1.default.encode(a, { useNamedReferences: true });
                        },
                        attrValueProcessor: function (a) {
                            return he_1.default.encode(a, {
                                // @ts-ignore
                                isAttributeValue: isAttribute,
                                useNamedReferences: true,
                            });
                        }, // default is a=>a
                    };
                    parser = new fast_xml_parser_1.default.j2xParser(optionsEncode);
                    jsonObj.feed.transformedBy = "vtex-xml-transformer-".concat(version);
                    xml = parser.parse(__assign(__assign({}, jsonObj), { feed: __assign(__assign({}, jsonObj.feed), { entry: newEntries }) }));
                    fs_1.default.writeFileSync(file, xml, "utf8");
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _g.sent();
                    console.log(err_1 === null || err_1 === void 0 ? void 0 : err_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, file];
            }
        });
    });
};
exports.default = XmlTransform;
