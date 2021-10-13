import fs from "fs";
import FastXmlParser from "fast-xml-parser";
import He from "he";
import Axios from "axios";
import { setup } from "axios-cache-adapter";
import { URL } from "url";

const api = setup({
  cache: {
    maxAge: 30 * 60 * 1000,
  },
});

function PromiseTimeout(delayms: number) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delayms);
  });
}

const XmlTransform = async ({
  storeName,
  file,
  regionId,
  salesChannel,
}: {
  storeName: string;
  file: fs.PathLike;
  regionId: string;
  salesChannel: string;
}): Promise<fs.PathLike> => {
  const xmlData = fs.readFileSync(file, "utf8");

  const optionsDecode = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
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
      if (jsonObj?.feed?.entry?.length) {
        console.log(`Processing ${jsonObj?.feed?.entry?.length} items`);
        jsonObj.feed.entry = await Promise.all(
          jsonObj?.feed?.entry.map(async (item: any, index: number) => {
            let link = item?.link?.__cdata;
            let sale_price = item?.["g:sale_price"]?.__cdata;
            const id = item?.id?.__cdata;

            // await PromiseTimeout(Math.floor(index / 20) * 10000); // tentativa de quebra de grupo e timeout

            // add new params
            try {
              const a = new URL(link);
              a.searchParams.append("region_id", regionId);
              a.searchParams.append("sc", salesChannel);
              link = a.toString();
            } catch (e: any) {
              console.log(e?.message);
            }

            let apiUrl;
            try {
              // OMG, this is a hack, but it works
              // - get details from API
              // VTEX doesen't have multiplier in XML: https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI
              const a = new URL(link);
              apiUrl = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search${a.pathname}`;

              const response = (await api.get(apiUrl)) as any;

              const sku = response?.data?.[0]?.items?.find(
                ({ itemId }: any) => {
                  return `${itemId}` === `${id}`;
                }
              );

              // if need recalculate price
              if (sku?.unitMultiplier && +sku?.unitMultiplier !== 1) {
                const seller = sku?.sellers?.find(
                  ({ sellerDefault }: any) => !!sellerDefault
                );
                console.log(
                  "🚀",
                  index,
                  response.request.fromCache,
                  +sku?.unitMultiplier,
                  !!seller
                );

                if (seller) {
                  sale_price =
                    seller?.commertialOffer?.Price * +sku?.unitMultiplier;
                  console.log(
                    "sale_price",
                    seller?.commertialOffer?.Price,
                    sale_price
                  );
                  if (!isNaN(sale_price)) {
                    sale_price = sale_price.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    });
                  } else {
                    sale_price = item?.["g:sale_price"]?.__cdata;
                  }
                }

                console.log("🚀 link", apiUrl);
              }
            } catch (e: any) {
              console.log("ERR url: ", apiUrl);
              console.log(e?.message);
            }

            const newData = {
              ...item,
              link: {
                __cdata: link,
              },
              "g:sale_price": {
                __cdata: sale_price,
              },
            };

            console.log(
              "🚀 ~ file: xmlTransform.ts ~ line 147 ~ jsonObj?.feed?.entry.map ~ newData",
              newData
            );
            return newData;
          })
        );
      }

      const optionsEncode = {
        attributeNamePrefix: "@_",
        attrNodeName: "@", //default is false
        textNodeName: "#text",
        ignoreAttributes: true,
        cdataTagName: "__cdata", //default is false
        cdataPositionChar: "\\c",
        format: false,
        indentBy: "  ",
        supressEmptyNode: false,
        tagValueProcessor: (a: string) =>
          He.encode(a, { useNamedReferences: true }), // default is a=>a
        attrValueProcessor: (a: string) =>
          He.encode(a, {
            // @ts-ignore
            isAttributeValue: isAttribute,
            useNamedReferences: true,
          }), // default is a=>a
      };
      const parser = new FastXmlParser.j2xParser(optionsEncode);
      jsonObj.feed.transformedBy = "swift-vtex-xml-transformer";
      const xml = parser.parse(jsonObj);
      fs.writeFileSync(file, xml, "utf8");
    } catch (err: any) {
      console.log(err?.message);
    }
  }

  return file;
};

export default XmlTransform;
