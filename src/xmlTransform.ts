import fs from "fs";
import FastXmlParser from "fast-xml-parser";
import He from "he";
import { setup } from "axios-cache-adapter";
import { URL } from "url";

const { version } = require(process.env.NODE_ENV === "production"
  ? "./package.json"
  : "../package.json");

const api = setup({
  cache: {
    maxAge: 30 * 60 * 1000,
  },
});

const XmlTransform = async ({
  storeName,
  file,
  regionId,
  salesChannel,
  complete = false,
}: {
  storeName: string;
  file: fs.PathLike;
  regionId: string;
  salesChannel: string;
  complete: boolean;
}): Promise<fs.PathLike> => {
  const xmlData = fs.readFileSync(file, "utf8");

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
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    numParseOptions: {
      hex: true,
      leadingZeros: true,
      //skipLike: /\+[0-9]{10}/
    },
    arrayMode: false, //"strict"
    attrValueProcessor: (val: string, attrName: string) =>
      He.decode(val, { isAttributeValue: true }), //default is a=>a
    tagValueProcessor: (val: string, tagName: string) => He.decode(val), //default is a=>a
    // stopNodes: ["parse-me-as-string"],
  };

  if (FastXmlParser.validate(xmlData) === true) {
    try {
      const jsonObj = FastXmlParser.parse(xmlData, optionsDecode);
      let newEntries = jsonObj?.rss?.channel?.item;
      if (jsonObj?.rss?.channel?.item?.length) {
        const skuList = jsonObj?.rss?.channel?.item.map(
          (item: any) => item?.["g:id"]?.__cdata
        );

        const chunkSize = 50;
        const chunks = [...Array(Math.ceil(skuList.length / chunkSize))].map(
          (_) => skuList.splice(0, chunkSize)
        );

        const productDetails = (
          await Promise.all(
            chunks.map(async (chunk: string[]) => {
              const urlSearch = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&${chunk
                .map((i) => `fq=skuId:${i}`)
                .join("&")}&sc=${salesChannel}`;

              const response = (await api.get(urlSearch)) as any;

              if (!response?.data?.length) {
                console.log(`API response is empty for ${urlSearch}`);
                return [];
              }

              return response.data?.reduce((stack: any[], product: any) => {
                return stack.concat(
                  product.items.map((sku: any) => {
                    const { unitMultiplier, sellers, itemId } = sku;
                    const seller = sellers?.find(
                      ({ sellerDefault }: any) => !!sellerDefault
                    );

                    let price = seller?.commertialOffer?.ListPrice;
                    let sale_price = seller?.commertialOffer?.Price;
                    let availability = seller?.commertialOffer?.IsAvailable;

                    if (seller) {
                      price = (seller?.commertialOffer?.ListPrice).toFixed(2);

                      if (isNaN(price)) {
                        price = (seller?.commertialOffer?.ListPrice).toFixed(2);
                      }
                    }

                    return {
                      itemId,
                      unitMultiplier,
                      price,
                      sale_price,
                      availability,
                    };
                  })
                );
              }, []);
            })
          )
        )
          .reduce((stack, group) => {
            return stack.concat(group);
          }, [])
          .reduce((stack: any, item: any) => {
            Object.assign(stack, { [item.itemId]: item });
            return stack;
          }, {});

        fs.writeFileSync(
          "products.json",
          JSON.stringify(productDetails),
          "utf8"
        );

        newEntries = await Promise.all(
          jsonObj?.rss?.channel?.item.map(async (item: any, index: number) => {
            let link = item?.["g:link"]?.__cdata;

            let price = item?.["g:price"]?.__cdata;
            let sale_price = item?.["g:sale_price"]?.__cdata;
            const id = item?.["g:id"]?.__cdata;

            // add new params
            try {
              const a = new URL(link);
              // a.searchParams.append("region_id", regionId);
              a.searchParams.append("sc", salesChannel);
              link = a.toString();
            } catch (e: any) {
              // @ts-ignore
              console.log(e?.message);
            }

            // OMG, this is a hack, but it works
            // - get details from API
            // VTEX doesen't have multiplier in XML: https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI

            // if product exist in list to change value
            if (productDetails.hasOwnProperty(`${id}`)) {
              sale_price = productDetails[`${id}`].sale_price;
              price = productDetails[`${id}`].price;
            } else {
              console.log(`SKU id ${id} no found in API`);
            }

            let availability = productDetails?.[`${id}`]?.availability
              ? "in stock"
              : "out of stock";

            if (complete) {
              return {
                ...item,
                "g:link": {
                  __cdata: link,
                },
                "g:region_id": {
                  __cdata: regionId,
                },
                "g:price": {
                  __cdata: `${price} BRL`,
                },
                "g:sale_price": {
                  __cdata: `${sale_price} BRL`,
                },
                "g:availability": {
                  __cdata: availability,
                },
              };
            } else {
              return {
                "g:availability": {
                  __cdata: availability,
                },
                "g:id": {
                  __cdata: item["g:id"].__cdata,
                },
                "g:link": {
                  __cdata: link,
                },
                "g:region_id": {
                  __cdata: regionId,
                },
                "g:price": {
                  __cdata: `${price} BRL`,
                },
                "g:sale_price": {
                  __cdata: `${sale_price} BRL`,
                },
              };
            }
          })
        );
      } else {
        console.log("root node <rss> not exist in this XML");
      }

      const optionsEncode = {
        attributeNamePrefix: "@_",
        // attrNodeName: "@", //default is false
        // textNodeName: "#text",
        ignoreAttributes: false,
        ignoreNameSpace: false,
        cdataTagName: "__cdata", //default is false
        cdataPositionChar: "\\c",
        format: true,
        indentBy: "  ",
        supressEmptyNode: false,
        tagValueProcessor: (a: string) =>
          He.encode(a, { useNamedReferences: true }), // default is a=>a
        attrValueProcessor: (a: string) =>
          He.encode(a, {
            // @ts-ignore
            isAttributeValue: true,
            useNamedReferences: true,
          }), // default is a=>a
      };
      const parser = new FastXmlParser.j2xParser(optionsEncode);
      jsonObj["@_xml"] = "1.0";
      jsonObj.rss["@_transformedBy"] = `vtex-xml-transformer-${version}`;
      jsonObj.rss["@_region_id"] = regionId;
      const newXmlObj = {
        ...jsonObj,
      };
      newXmlObj.rss.channel = {
        ...jsonObj.rss.channel,
        item: newEntries,
      };

      const xml = parser.parse(newXmlObj);

      fs.writeFileSync(file, `<?xml version="1.0"?>${xml}`, "utf8");
    } catch (err: any) {
      // @ts-ignore
      console.log(err?.message);
    }
  } else {
    console.log("XMLData is not valid XML");
  }

  return file;
};

export default XmlTransform;
