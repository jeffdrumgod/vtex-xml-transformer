"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_http = __toESM(require("http"));
var import_fs4 = __toESM(require("fs"));
var import_path2 = require("path");
var import_url3 = __toESM(require("url"));

// src/download.ts
var import_https = __toESM(require("https"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
async function Download(url, dest) {
  const tmpFolder = import_path.default.dirname(dest);
  import_fs.default.readdir(tmpFolder, (_, files) => {
    files?.forEach((file) => {
      import_fs.default.stat(import_path.default.join(tmpFolder, file), (err, stat) => {
        if (err) {
          console.error(err);
        }
        const now = (/* @__PURE__ */ new Date()).getTime();
        const endTime = new Date(stat.ctime).getTime() + 6e4 * 10;
        if (now > endTime) {
          import_fs.default.unlink(import_path.default.join(tmpFolder, file), (errUnlink) => {
            if (errUnlink) {
              console.error(errUnlink);
            }
          });
        }
      });
    });
  });
  return new Promise((resolve2, reject) => {
    const file = import_fs.default.createWriteStream(dest, { flags: "wx" });
    const request = import_https.default.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        import_fs.default.unlink(dest, () => {
        });
        reject(Error(`Server responded with ${response.statusCode} for ${url}: ${response.statusMessage}`));
      }
    });
    request.on("error", (err) => {
      file.close();
      import_fs.default.unlink(dest, () => {
      });
      reject(err.message);
    });
    file.on("finish", () => {
      resolve2(dest);
    });
    file.on("error", (err) => {
      file.close();
      import_fs.default.unlink(dest, () => {
      });
      reject(err.message);
    });
  });
}
var download_default = Download;

// src/getVersion.ts
var import_fs2 = __toESM(require("fs"));
var getVersion = () => {
  let version3;
  try {
    if (import_fs2.default.statSync("./package.json")) {
      const jsonFile = process.env.NODE_ENV === "production" ? "./package.json" : "../package.json";
      version3 = JSON.parse(import_fs2.default.readFileSync(jsonFile, "utf8")).version;
    } else {
      version3 = "unknown";
    }
  } catch (e) {
    version3 = "unknown";
  }
  return version3;
};
var getVersion_default = getVersion;

// src/requestHandler.ts
var import_url = __toESM(require("url"));
var version = getVersion_default();
var RequestHandler = (req, res) => {
  const urlParsed = import_url.default.parse(req?.url ?? "", true);
  const queryObject = urlParsed.query;
  if (req.method !== "GET" || !["/xml-parse", "/status"].includes(urlParsed?.pathname || "")) {
    res.statusCode = 404;
    res.end("Method or end-point not allowed");
    return;
  }
  if (urlParsed?.pathname === "/status") {
    res.statusCode = 200;
    res.end(`ok - ${version}`);
    return;
  }
  if (urlParsed?.pathname === "/xml-parse") {
    const requiredParams = ["storeDomain", "storeName", "xmlName", "regionId", "salesChannel"];
    for (const param of requiredParams) {
      if (!queryObject[param]) {
        res.statusCode = 400;
        res.end(`Missing required parameter: ${param}`);
        return;
      }
    }
  }
};
var requestHandler_default = RequestHandler;

// src/xmlTransform.ts
var import_fs3 = __toESM(require("fs"));
var import_fast_xml_parser = __toESM(require("fast-xml-parser"));
var import_he = __toESM(require("he"));
var import_axios_cache_interceptor = require("axios-cache-interceptor");
var import_axios = __toESM(require("axios"));
var import_url2 = require("url");
var version2 = getVersion_default();
var api = (0, import_axios_cache_interceptor.setupCache)(import_axios.default, {
  debug: console.log,
  storage: (0, import_axios_cache_interceptor.buildMemoryStorage)(),
  ttl: 1e3 * 60 * 1
  // 1 minute
});
var XmlTransform = async ({
  storeName,
  file,
  regionId,
  salesChannel,
  complete = false,
  isMainFeed = false,
  globalCategory
}) => {
  const xmlData = import_fs3.default.readFileSync(file, "utf8");
  const optionsDecode = {
    attributeNamePrefix: "@_",
    // attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata",
    // default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    numParseOptions: {
      hex: true,
      leadingZeros: true
      // skipLike: /\+[0-9]{10}/
    },
    arrayMode: false,
    // "strict"
    attrValueProcessor: (val, _attrName) => import_he.default.decode(val, { isAttributeValue: true }),
    // default is a=>a
    tagValueProcessor: (val, _tagName) => import_he.default.decode(val)
    // default is a=>a
    // stopNodes: ["parse-me-as-string"],
  };
  const lines = xmlData.split("\n");
  const lastLine = lines[lines.length - 1];
  const commentMatch = lastLine.match(/<!--(.*?)-->/);
  const vtexXmlDetails = commentMatch?.[1] ?? " -- no details -- ";
  if (import_fast_xml_parser.default.XMLValidator.validate(xmlData) === true) {
    try {
      const xmlParser = new import_fast_xml_parser.default.XMLParser();
      const jsonObj = xmlParser.parse(xmlData, optionsDecode);
      let newEntries = jsonObj?.rss?.channel?.item;
      if (jsonObj?.rss?.channel?.item?.length) {
        const skuList = jsonObj?.rss?.channel?.item.map((item) => item?.["g:id"]);
        const chunkSize = 50;
        const chunks = [...Array(Math.ceil(skuList.length / chunkSize))].map((_) => skuList.splice(0, chunkSize));
        const productDetails = (await Promise.all(
          chunks.map(async (chunk) => {
            const urlSearch = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&${chunk.map((i) => `fq=skuId:${i}`).join("&")}&sc=${salesChannel}`;
            const response = await api.get(urlSearch);
            if (!response?.data?.length) {
              console.log(`API response is empty for ${urlSearch}`);
              return [];
            }
            return response.data?.reduce(
              (stack, product) => stack.concat(
                product.items.map((sku) => {
                  const { unitMultiplier, sellers, itemId, ean, measurementUnit } = sku;
                  const seller = sellers?.find(({ sellerDefault }) => !!sellerDefault);
                  let price = seller?.commertialOffer?.ListPrice;
                  const salePrice = seller?.commertialOffer?.Price;
                  const availability = seller?.commertialOffer?.IsAvailable;
                  if (seller) {
                    price = +seller?.commertialOffer?.ListPrice?.toFixed(2);
                    if (Number.isNaN(price)) {
                      price = (+seller?.commertialOffer?.ListPrice)?.toFixed(2);
                    }
                  }
                  return {
                    ean,
                    itemId,
                    unitMultiplier,
                    measurementUnit,
                    price,
                    salePrice,
                    availability
                  };
                })
              ),
              []
            );
          })
        )).reduce((stack, group) => stack.concat(group), []).reduce((stack, item) => {
          Object.assign(stack, { [item.itemId]: item });
          return stack;
        }, {});
        import_fs3.default.writeFileSync("products.json", JSON.stringify(productDetails), "utf8");
        newEntries = await Promise.all(
          jsonObj?.rss?.channel?.item.map(async (item, index) => {
            let link = item?.["g:link"]?.__cdata ?? item?.["link"]?.__cdata;
            let price = item?.["g:price"];
            let salePrice = item?.["g:sale_price"];
            const id = item?.["g:id"];
            try {
              const a = new import_url2.URL(link);
              a.searchParams.append("sc", salesChannel);
              link = a.toString();
            } catch (e) {
              console.log("Error parsing URL:", link, e?.message);
            }
            if ({}.hasOwnProperty.call(productDetails, `${id}`)) {
              salePrice = productDetails[`${id}`].salePrice;
              price = productDetails[`${id}`].price;
            } else {
              console.log(`SKU id ${id} no found in API`);
            }
            let availability;
            if (isMainFeed) {
              availability = "out of stock";
            } else {
              availability = productDetails?.[`${id}`]?.availability ? "in stock" : "out of stock";
            }
            const isProductVariable = productDetails?.[`${id}`]?.measurementUnit?.toLocaleLowerCase() === "kg";
            if (complete) {
              return {
                ...item,
                "g:link": link,
                "g:availability": availability,
                ...isMainFeed ? {
                  "g:price": `${price} BRL`
                } : {
                  // se não for main feed, apresenta preço e região
                  "g:region_id": regionId,
                  "g:price": `${price} BRL`,
                  "g:sale_price": `${salePrice} BRL`
                },
                ...globalCategory ? { "g:google_product_category": globalCategory } : {},
                ...isProductVariable ? { "g:gtin": "" } : {}
              };
            }
            return {
              "g:id": item["g:id"],
              "g:region_id": regionId,
              "g:price": `${price} BRL`,
              "g:sale_price": `${salePrice} BRL`,
              "g:availability": availability
            };
          })
        );
      } else {
        console.log("root node <rss> not exist in this XML");
      }
      const optionsEncode = {
        /*
        attributeNamePrefix: '@_',
        // attrNodeName: "@", //default is false
        // textNodeName: "#text",
        ignoreAttributes: false,
        ignoreNameSpace: false,
        // cdataTagName: '__cdata', // default is false
        cdataPositionChar: '\\c',
        format: true,
        indentBy: '  ',
        supressEmptyNode: false,
        tagValueProcessor: (a: string) => He.encode(a, { useNamedReferences: true }), // default is a=>a
        attrValueProcessor: (a: string) =>
          He.encode(a, {
            // @ts-ignore
            isAttributeValue: true,
            useNamedReferences: true,
          }), // default is a=>a
          */
        // preserveOrder: true,
        arrayNodeName: "item"
      };
      const xmlBuilder = new import_fast_xml_parser.default.XMLBuilder(optionsEncode);
      const xml = xmlBuilder.build(newEntries);
      import_fs3.default.writeFileSync(
        file,
        `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
${xml}
</channel>
</rss><!-- transformedBy="vtex-xml-transformer-${version2}" region_id="${regionId}" | From VTEX: ${vtexXmlDetails} -->`,
        "utf8"
      );
    } catch (err) {
      console.log("CATCH ERROR XmlTransform", err);
    }
  } else {
    console.log("XMLData is not valid XML");
  }
  return file;
};
var xmlTransform_default = XmlTransform;

// src/index.ts
var port = 8e3;
var getRemoteVtexXml = async ({
  storeDomain,
  storeName,
  xmlName,
  salesChannel
}) => {
  const time = (/* @__PURE__ */ new Date()).getTime();
  const file = (0, import_path2.resolve)("./tmp", `${storeName}-${xmlName}-${time}.xml`);
  const url = `https://${storeDomain}/XMLData/${xmlName}.xml?sc=${salesChannel}`;
  console.log(`Downloading XML from: ${url}`);
  const savedFile = await download_default(url, file);
  return savedFile;
};
var server = import_http.default.createServer(requestHandler_default);
var requestCounter = 0;
server.on("request", async (req, res) => {
  if (res.writableEnded) {
    return;
  }
  const { headers, method, url } = req;
  const queryObject = import_url3.default.parse(url ?? "", true).query;
  requestCounter += 1;
  console.log(`Request (${requestCounter}) - START: ${url}`);
  try {
    const fileName = await getRemoteVtexXml(
      queryObject
    );
    const fileNameTransformed = await xmlTransform_default({
      file: fileName,
      storeName: queryObject?.storeName ?? "",
      regionId: queryObject?.regionId ?? "",
      salesChannel: queryObject?.salesChannel ?? "",
      complete: !!queryObject?.complete,
      isMainFeed: !!queryObject?.isMainFeed,
      globalCategory: queryObject?.globalCategory
    });
    const stat = import_fs4.default.statSync(fileNameTransformed);
    const readStream = import_fs4.default.createReadStream(fileNameTransformed);
    readStream.on(
      "open",
      () => res.writeHead(200, {
        "Content-Type": "text/xml",
        "Content-Length": stat.size
      })
    );
    readStream.pipe(res);
  } catch (err) {
    res.statusCode = 500;
    console.log(err);
    console.log(
      "ERR:",
      JSON.stringify({
        headers,
        method,
        url,
        err
      })
    );
    res.end("Error");
  }
  console.log(`Request (${requestCounter}) - END: ${url}`);
});
server.listen(port, () => {
  console.log(`Server up on port ${port}`);
});
server.timeout = 3e5;
