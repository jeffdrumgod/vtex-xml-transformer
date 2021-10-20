import fs from "fs";
import FastXmlParser from "fast-xml-parser";
import He from "he";
import { setup } from "axios-cache-adapter";
import { URL } from "url";

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
      let newEntries = jsonObj?.feed?.entry;
      if (jsonObj?.feed?.entry?.length) {
        const skuList = jsonObj?.feed?.entry.map(
          (item: any) => item?.id?.__cdata
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
                .join("&")}`;

              const response = (await api.get(urlSearch)) as any;

              if (!response?.data?.length) {
                return [];
              }

              return response.data?.reduce((stack: any[], product: any) => {
                return stack.concat(
                  product.items.map((sku: any) => {
                    const { unitMultiplier, sellers, itemId } = sku;
                    const seller = sellers?.find(
                      ({ sellerDefault }: any) => !!sellerDefault
                    );
                    let sale_price = seller?.commertialOffer?.Price;

                    if (seller) {
                      sale_price =
                        seller?.commertialOffer?.Price * +sku?.unitMultiplier;

                      if (!isNaN(sale_price)) {
                        sale_price = sale_price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        });
                      } else {
                        sale_price =
                          seller?.commertialOffer?.Price.toLocaleString(
                            "pt-BR",
                            {
                              style: "currency",
                              currency: "BRL",
                            }
                          );
                      }
                    }

                    return {
                      itemId,
                      unitMultiplier,
                      sale_price,
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
            if (item.unitMultiplier !== 1) {
              Object.assign(stack, { [item.itemId]: item });
            }
            return stack;
          }, {});

        newEntries = await Promise.all(
          jsonObj?.feed?.entry.map(async (item: any, index: number) => {
            let link = item?.link?.__cdata;
            let sale_price = item?.["g:sale_price"]?.__cdata;
            const id = item?.id?.__cdata;

            // add new params
            try {
              const a = new URL(link);
              // a.searchParams.append("region_id", regionId);
              a.searchParams.append("sc", salesChannel);
              link = a.toString();
            } catch (e: any) {
              console.log(e?.message);
            }

            // OMG, this is a hack, but it works
            // - get details from API
            // VTEX doesen't have multiplier in XML: https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI

            // if product exist in list to change value
            if (productDetails.hasOwnProperty(`${id}`)) {
              sale_price = productDetails[`${id}`].sale_price;
            }

            return {
              ...item,
              link: {
                __cdata: link,
              },
              region_id: regionId,
              "g:sale_price": {
                __cdata: sale_price,
              },
              unitMultiplier: `${
                productDetails?.[`${id}`]?.unitMultiplier || 1
              }`,
            };
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
      jsonObj.feed.transformedBy = "vtex-xml-transformer";
      const xml = parser.parse({
        ...jsonObj,
        feed: {
          ...jsonObj.feed,
          entry: newEntries,
        },
      });

      fs.writeFileSync(file, xml, "utf8");
    } catch (err: any) {
      console.log(err?.message);
    }
  }

  return file;
};

export default XmlTransform;
