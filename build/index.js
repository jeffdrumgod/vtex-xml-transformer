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
var import_fs6 = __toESM(require("fs"));
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
  const weekInMillis = 6e4 * 60 * 24 * 7;
  import_fs.default.readdir(tmpFolder, (_, files) => {
    files?.forEach((file) => {
      import_fs.default.stat(import_path.default.join(tmpFolder, file), (err, stat) => {
        if (err) {
          console.error(err);
        }
        const now = (/* @__PURE__ */ new Date()).getTime();
        const endTime = new Date(stat.ctime).getTime() + weekInMillis;
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
    const request = import_https.default.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        }
      },
      (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
        } else {
          file.close();
          import_fs.default.unlink(dest, () => {
          });
          reject(Error(`Server responded with ${response.statusCode} for ${url}: ${response.statusMessage}`));
        }
      }
    );
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
  let version4;
  try {
    if (import_fs2.default.statSync("./package.json")) {
      const jsonFile = process.env.NODE_ENV === "production" ? "./package.json" : "../package.json";
      version4 = JSON.parse(import_fs2.default.readFileSync(jsonFile, "utf8")).version;
    } else {
      version4 = "unknown";
    }
  } catch (e) {
    version4 = "unknown";
  }
  return version4;
};
var getVersion_default = getVersion;

// src/requestHandler.ts
var import_url = __toESM(require("url"));
var version = getVersion_default();
var ROUTES = {
  status: "/status",
  google: "/xml-parse",
  meta: "/xml-parse-meta"
};
var REQUIRED_PARAMS = {
  [ROUTES.google]: ["storeDomain", "storeName", "xmlName", "regionId", "salesChannel"],
  [ROUTES.meta]: ["storeDomain", "storeName", "xmlName", "salesChannel"]
};
var RequestHandler = (req, res) => {
  const urlParsed = import_url.default.parse(req?.url ?? "", true);
  const queryObject = urlParsed.query;
  const pathname = urlParsed?.pathname || "";
  if (req.method !== "GET" || !Object.values(ROUTES).includes(pathname)) {
    res.statusCode = 404;
    res.end("Method or end-point not allowed");
    return;
  }
  if (pathname === ROUTES.status) {
    res.statusCode = 200;
    res.end(`ok - ${version}`);
    return;
  }
  const requiredParams = REQUIRED_PARAMS[pathname] ?? [];
  for (const param of requiredParams) {
    if (!queryObject[param]) {
      res.statusCode = 400;
      res.end(`Missing required parameter: ${param}`);
      return;
    }
  }
  if (pathname === ROUTES.meta) {
    const idType = queryObject.idType;
    if (idType && !["sku", "product"].includes(`${idType}`)) {
      res.statusCode = 400;
      res.end('Invalid parameter idType: expected "sku" or "product"');
    }
  }
};
var requestHandler_default = RequestHandler;

// src/xmlTransform.ts
var import_fs4 = __toESM(require("fs"));
var import_fast_xml_parser = require("fast-xml-parser");
var import_he = __toESM(require("he"));

// src/productDetails.ts
var import_fs3 = __toESM(require("fs"));
var import_axios_cache_interceptor = require("axios-cache-interceptor");
var import_axios = __toESM(require("axios"));
var api = (0, import_axios_cache_interceptor.setupCache)(import_axios.default, {
  debug: console.log,
  storage: (0, import_axios_cache_interceptor.buildMemoryStorage)(),
  ttl: 1e3 * 60 * 1
  // 1 minute
});
var CHUNK_SIZE = 50;
var fetchProductDetails = async ({
  storeName,
  salesChannel,
  skuIds
}) => {
  const skuList = [...skuIds];
  const chunks = [...Array(Math.ceil(skuList.length / CHUNK_SIZE))].map(() => skuList.splice(0, CHUNK_SIZE));
  const groups = await Promise.all(
    chunks.map(async (chunk) => {
      const urlSearch = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&${chunk.map((i) => `fq=skuId:${i}`).join("&")}&sc=${salesChannel}`;
      const response = await api.get(urlSearch);
      if (!response?.data?.length) {
        console.log(`API response is empty for ${urlSearch}`);
        return [];
      }
      return response.data.reduce(
        (stack, product) => stack.concat(
          product.items.map((sku) => {
            const { unitMultiplier, sellers, itemId, ean, measurementUnit, images } = sku;
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
              availability,
              productId: `${product.productId ?? ""}`,
              productName: product.productName ?? "",
              description: product.description ?? "",
              metaTagDescription: product.metaTagDescription ?? "",
              brand: product.brand ?? "",
              productReference: product.productReference ?? "",
              linkText: product.linkText ?? "",
              images: (images ?? []).map((img) => ({
                imageId: `${img.imageId ?? ""}`,
                imageText: img.imageText ?? "",
                imageUrl: img.imageUrl ?? ""
              }))
            };
          })
        ),
        []
      );
    })
  );
  const details = groups.reduce((stack, group) => stack.concat(group), []).reduce((stack, item) => {
    Object.assign(stack, { [item.itemId]: item });
    return stack;
  }, {});
  import_fs3.default.writeFileSync("products.json", JSON.stringify(details), "utf8");
  return details;
};
var productDetails_default = fetchProductDetails;

// src/linkBuilder.ts
var import_url2 = require("url");
var formatProductPathUrl = (urlObject, customTypeFormat) => {
  const slug = urlObject.pathname.split("/").filter((i) => !!i).at(0) ?? "";
  switch (customTypeFormat) {
    case "prefix-detail":
      return `/detail/${slug}`;
    default:
      return urlObject.pathname;
  }
};
var applyUtm = (urlObject, utm) => {
  if (utm.keepUtm === false) {
    [...urlObject.searchParams.keys()].filter((key) => key.toLowerCase().startsWith("utm_")).forEach((key) => urlObject.searchParams.delete(key));
    return;
  }
  if (utm.utmSource) urlObject.searchParams.set("utm_source", utm.utmSource);
  if (utm.utmMedium) urlObject.searchParams.set("utm_medium", utm.utmMedium);
  if (utm.utmCampaign) urlObject.searchParams.set("utm_campaign", utm.utmCampaign);
};
var buildProductLink = ({
  link,
  storeDomain,
  salesChannel,
  customProductUrlType,
  utm,
  replaceSalesChannel = false
}) => {
  try {
    const a = new import_url2.URL(link);
    if (replaceSalesChannel) {
      a.searchParams.set("sc", salesChannel);
    } else {
      a.searchParams.append("sc", salesChannel);
    }
    a.hostname = storeDomain;
    a.pathname = formatProductPathUrl(a, customProductUrlType);
    if (utm) {
      applyUtm(a, utm);
    }
    return a.toString();
  } catch (e) {
    console.log("Error parsing URL:", link, e?.message);
    return link;
  }
};
var linkBuilder_default = buildProductLink;

// src/xmlTransform.ts
var version2 = getVersion_default();
var XmlTransform = async ({
  storeName,
  storeDomain,
  file,
  regionId,
  salesChannel,
  complete = false,
  isMainFeed = false,
  globalCategory,
  customProductUrlType
}) => {
  const xmlData = import_fs4.default.readFileSync(file, "utf8");
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
  console.log("Start XML reading and validation");
  const validated = import_fast_xml_parser.XMLValidator.validate(xmlData);
  if (validated === true) {
    try {
      const xmlParser = new import_fast_xml_parser.XMLParser();
      const jsonObj = xmlParser.parse(xmlData, optionsDecode);
      let newEntries = jsonObj?.rss?.channel?.item;
      if (jsonObj?.rss?.channel?.item?.length) {
        const skuList = jsonObj?.rss?.channel?.item.map((item) => item?.["g:id"]);
        const productDetails = await productDetails_default({ storeName, salesChannel, skuIds: skuList });
        newEntries = await Promise.all(
          jsonObj?.rss?.channel?.item.map(async (item, index) => {
            let link = item?.["g:link"]?.__cdata || item?.["g:link"] || item?.["link"]?.__cdata || item?.["link"];
            let title = item?.["g:title"]?.__cdata || item?.["g:title"] || item?.["title"]?.__cdata || item?.["title"];
            let product_category = item?.["g:google_product_category"]?.__cdata || item?.["g:google_product_category"] || item?.["google_product_category"]?.__cdata || item?.["google_product_category"];
            let description = item?.["g:description"]?.__cdata || item?.["g:description"] || item?.["description"]?.__cdata || item?.["description"];
            if (item?.["link"]) {
              delete item?.["link"];
            }
            if (item?.["title"]) {
              delete item?.["title"];
            }
            if (item?.["description"]) {
              delete item?.["description"];
            }
            if (item?.["product_category"]) {
              delete item?.["product_category"];
            }
            let price = item?.["g:price"];
            let salePrice = item?.["g:sale_price"];
            const id = item?.["g:id"];
            link = linkBuilder_default({ link, storeDomain, salesChannel, customProductUrlType });
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
                "g:title": {
                  __cdata: title
                },
                "g:product_category": {
                  __cdata: product_category
                },
                "g:description": {
                  __cdata: description
                },
                "g:link": {
                  __cdata: link
                },
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
        cdataPropName: "__cdata",
        arrayNodeName: "item"
      };
      const xmlBuilder = new import_fast_xml_parser.XMLBuilder(optionsEncode);
      const xml = xmlBuilder.build(newEntries);
      import_fs4.default.writeFileSync(
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

// src/metaTransform.ts
var import_fs5 = __toESM(require("fs"));
var import_fast_xml_parser2 = require("fast-xml-parser");
var version3 = getVersion_default();
var MOCKUP_SUFFIX = "_mck";
var TITLE_MAX = 200;
var DESCRIPTION_MAX = 9999;
var PRODUCT_TYPE_MAX = 750;
var truncate = (value, max) => value.length > max ? value.slice(0, max) : value;
var THUMB_SUFFIX = "_tn";
var pick = (item, name) => {
  const raw = item?.[`g:${name}`] ?? item?.[name];
  if (raw === void 0 || raw === null) return void 0;
  if (typeof raw === "object") return raw.__cdata ?? raw["#text"];
  return `${raw}`;
};
var cdata = (value) => ({ __cdata: value });
var formatPrice = (value) => {
  if (value === void 0 || value === null || value === "") return void 0;
  const n = +value;
  if (Number.isNaN(n)) return void 0;
  return `${n.toFixed(2)} BRL`;
};
var resolveImages = (detail) => {
  const images = detail?.images ?? [];
  const main = images.find((img) => img.imageText?.toLowerCase().endsWith(MOCKUP_SUFFIX)) ?? images[0];
  const additional = images.filter((img) => img !== main && !img.imageText?.toLowerCase().endsWith(THUMB_SUFFIX)).map((img) => img.imageUrl).filter((url) => !!url);
  return { main: main?.imageUrl, additional };
};
var buildMetaItem = ({
  item,
  detail,
  options
}) => {
  const { storeDomain, salesChannel, idType, utm, globalCategory, customProductUrlType } = options;
  const skuId = pick(item, "id") ?? detail.itemId;
  const id = idType === "product" ? detail.productId : skuId;
  const title = truncate(pick(item, "title") || detail.productName || "", TITLE_MAX);
  const description = truncate(
    pick(item, "description") || detail.description || pick(item, "summary") || detail.metaTagDescription || title,
    DESCRIPTION_MAX
  );
  const brand = pick(item, "brand") || detail.brand;
  const condition = pick(item, "condition") || "new";
  const productType = truncate(pick(item, "product_type") ?? "", PRODUCT_TYPE_MAX);
  const googleCategory = globalCategory || pick(item, "google_product_category");
  const mpn = pick(item, "mpn") || detail.productReference;
  const isProductVariable = (detail.measurementUnit ?? "").toLowerCase() === "kg";
  const gtin = isProductVariable ? "" : pick(item, "gtin") || detail.ean || "";
  const link = linkBuilder_default({
    link: pick(item, "link") ?? "",
    storeDomain,
    salesChannel,
    customProductUrlType,
    utm,
    replaceSalesChannel: true
  });
  const { main: imageLink, additional } = resolveImages(detail);
  const hasSale = detail.salePrice !== void 0 && detail.price !== void 0 && +detail.salePrice < +detail.price;
  return {
    "g:id": id,
    "g:item_group_id": detail.productId,
    "g:title": cdata(title),
    "g:description": cdata(description),
    "g:availability": detail.availability ? "in stock" : "out of stock",
    "g:condition": condition,
    "g:price": formatPrice(detail.price),
    ...hasSale ? { "g:sale_price": formatPrice(detail.salePrice) } : {},
    "g:link": cdata(link),
    "g:image_link": cdata(imageLink || pick(item, "image_link") || ""),
    ...additional.length ? { "g:additional_image_link": additional.map(cdata) } : {},
    "g:brand": cdata(brand),
    ...gtin ? { "g:gtin": gtin } : {},
    ...mpn ? { "g:mpn": mpn } : {},
    ...googleCategory ? { "g:google_product_category": cdata(googleCategory) } : {},
    ...productType ? { "g:product_type": cdata(productType) } : {}
  };
};
var MetaTransform = async (options) => {
  const { file, storeName, salesChannel, regionId, idType } = options;
  const xmlData = import_fs5.default.readFileSync(file, "utf8");
  const optionsDecode = {
    attributeNamePrefix: "@_",
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    parseTagValue: false,
    // preserva zeros à esquerda em gtin/id
    parseAttributeValue: false,
    trimValues: true
  };
  const lastLine = xmlData.trimEnd().split("\n").pop() ?? "";
  const commentMatch = lastLine.match(/<!--(.*?)-->/);
  const vtexXmlDetails = (commentMatch?.[1] ?? " no details ").replace(/-{2,}/g, "-");
  console.log("[meta] Start XML reading and validation");
  const validated = import_fast_xml_parser2.XMLValidator.validate(xmlData);
  if (validated !== true) {
    throw new Error("[meta] XMLData is not valid XML");
  }
  let entries = [];
  try {
    const xmlParser = new import_fast_xml_parser2.XMLParser(optionsDecode);
    const jsonObj = xmlParser.parse(xmlData);
    let items = jsonObj?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];
    if (!items.length) {
      console.log("[meta] no <item> found in XML");
    } else {
      const skuIds = items.map((item) => `${pick(item, "id") ?? ""}`).filter((i) => !!i);
      const productDetails = await productDetails_default({ storeName, salesChannel, skuIds });
      const seen = /* @__PURE__ */ new Set();
      let discardedNoApi = 0;
      let discardedDuplicate = 0;
      const candidates = items.map((item) => ({ item, detail: productDetails[`${pick(item, "id")}`] })).filter(({ item, detail }) => {
        if (!detail) {
          discardedNoApi += 1;
          console.log(`[meta] SKU id ${pick(item, "id")} not found in API, discarded`);
          return false;
        }
        return true;
      });
      if (idType === "product") {
        candidates.sort((a, b) => Number(!!b.detail.availability) - Number(!!a.detail.availability));
      }
      let discardedInvalid = 0;
      const REQUIRED = ["g:id", "g:title", "g:description", "g:price", "g:link", "g:image_link", "g:brand"];
      const valueOf = (v) => v && typeof v === "object" ? v.__cdata : v;
      entries = candidates.map(({ item, detail }) => buildMetaItem({ item, detail, options })).filter((entry) => {
        const missing = REQUIRED.filter((key) => !valueOf(entry[key]));
        if (missing.length) {
          discardedInvalid += 1;
          console.log(`[meta] SKU id ${entry["g:id"]} discarded, missing: ${missing.join(", ")}`);
          return false;
        }
        return true;
      }).filter((entry) => {
        const key = `${entry["g:id"]}`;
        if (seen.has(key)) {
          discardedDuplicate += 1;
          return false;
        }
        seen.add(key);
        return true;
      });
      console.log(
        `[meta] items: ${items.length}, exported: ${entries.length}, discardedNoApi: ${discardedNoApi}, discardedInvalid: ${discardedInvalid}, discardedDuplicate: ${discardedDuplicate}`
      );
    }
    const xmlBuilder = new import_fast_xml_parser2.XMLBuilder({
      cdataPropName: "__cdata"
    });
    const xml = entries.map((entry) => `    ${xmlBuilder.build({ item: entry })}`).join("\n");
    import_fs5.default.writeFileSync(
      file,
      `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
${xml}
</channel>
</rss><!-- transformedBy="vtex-xml-transformer-${version3}" format="meta" region_id="${regionId}" sc="${salesChannel}" idType="${idType}" | From VTEX: ${vtexXmlDetails} -->`,
      "utf8"
    );
  } catch (err) {
    console.log("[meta] CATCH ERROR MetaTransform", err);
    throw err;
  }
  return file;
};
var metaTransform_default = MetaTransform;

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
  const urlParsed = import_url3.default.parse(url ?? "", true);
  const queryObject = urlParsed.query;
  const pathname = urlParsed.pathname || "";
  requestCounter += 1;
  console.log(`Request (${requestCounter}) - START: ${url}`);
  try {
    const fileName = await getRemoteVtexXml(
      queryObject
    );
    console.log(`File downloaded: ${fileName}`);
    const fileNameTransformed = pathname === ROUTES.meta ? await metaTransform_default({
      file: fileName,
      storeName: queryObject?.storeName ?? "",
      storeDomain: queryObject?.storeDomain ?? "",
      regionId: queryObject?.regionId ?? "",
      salesChannel: queryObject?.salesChannel ?? "",
      idType: queryObject?.idType === "product" ? "product" : "sku",
      utm: {
        keepUtm: !["0", "false"].includes(`${queryObject?.utm ?? "1"}`),
        utmSource: queryObject?.utmSource,
        utmMedium: queryObject?.utmMedium,
        utmCampaign: queryObject?.utmCampaign
      },
      globalCategory: queryObject?.globalCategory,
      customProductUrlType: queryObject?.customProductUrlType
    }) : await xmlTransform_default({
      file: fileName,
      storeName: queryObject?.storeName ?? "",
      storeDomain: queryObject?.storeDomain ?? "",
      regionId: queryObject?.regionId ?? "",
      salesChannel: queryObject?.salesChannel ?? "",
      complete: !!queryObject?.complete,
      isMainFeed: !!queryObject?.isMainFeed,
      globalCategory: queryObject?.globalCategory,
      customProductUrlType: queryObject?.customProductUrlType
    });
    const stat = import_fs6.default.statSync(fileNameTransformed);
    const readStream = import_fs6.default.createReadStream(fileNameTransformed);
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
//# sourceMappingURL=index.js.map