import fs from 'fs';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import He from 'he';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';
import Axios from 'axios';
import { URL } from 'url';
import getVersion from 'getVersion';

const version = getVersion();

const api = setupCache(Axios, {
  debug: console.log,
  storage: buildMemoryStorage(),
  ttl: 1000 * 60 * 1, // 1 minute
});

const XmlTransform = async ({
  storeName,
  file,
  regionId,
  salesChannel,
  complete = false,
  isMainFeed = false,
  globalCategory,
}: {
  storeName: string;
  file: fs.PathLike;
  regionId: string;
  salesChannel: string;
  complete: boolean;
  isMainFeed: boolean;
  globalCategory: string;
}): Promise<fs.PathLike> => {
  const xmlData = fs.readFileSync(file, 'utf8');

  const optionsDecode = {
    attributeNamePrefix: '@_',
    // attrNodeName: "attr", //default is 'false'
    textNodeName: '#text',
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: '__cdata', // default is 'false'
    cdataPositionChar: '\\c',
    parseTrueNumberOnly: false,
    numParseOptions: {
      hex: true,
      leadingZeros: true,
      // skipLike: /\+[0-9]{10}/
    },
    arrayMode: false, // "strict"
    attrValueProcessor: (val: string, _attrName: string) => He.decode(val, { isAttributeValue: true }), // default is a=>a
    tagValueProcessor: (val: string, _tagName: string) => He.decode(val), // default is a=>a
    // stopNodes: ["parse-me-as-string"],
  };

  const lines = xmlData.split('\n');
  const lastLine = lines[lines.length - 1];
  const commentMatch = lastLine.match(/<!--(.*?)-->/);
  const vtexXmlDetails = commentMatch?.[1] ?? ' -- no details -- ';
  console.log('Start XML reading and validation');

  const validated = XMLValidator.validate(xmlData);

  if (validated === true) {
    try {
      const xmlParser = new XMLParser();
      const jsonObj = xmlParser.parse(xmlData, optionsDecode);

      let newEntries = jsonObj?.rss?.channel?.item;
      if (jsonObj?.rss?.channel?.item?.length) {
        const skuList = jsonObj?.rss?.channel?.item.map((item: any) => item?.['g:id']);

        const chunkSize = 50;
        const chunks = [...Array(Math.ceil(skuList.length / chunkSize))].map((_) => skuList.splice(0, chunkSize));

        const productDetails = (
          await Promise.all(
            chunks.map(async (chunk: string[]) => {
              const urlSearch = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&${chunk
                .map((i) => `fq=skuId:${i}`)
                .join('&')}&sc=${salesChannel}`;

              //console.log(`Fetching product details from: ${urlSearch}`);

              const response = (await api.get(urlSearch)) as any;

              if (!response?.data?.length) {
                console.log(`API response is empty for ${urlSearch}`);
                return [];
              }

              return response.data?.reduce(
                (stack: any[], product: any) =>
                  stack.concat(
                    product.items.map((sku: any) => {
                      const { unitMultiplier, sellers, itemId, ean, measurementUnit } = sku;
                      const seller = sellers?.find(({ sellerDefault }: any) => !!sellerDefault);

                      let price = seller?.commertialOffer?.ListPrice;
                      const salePrice = seller?.commertialOffer?.Price;
                      const availability = seller?.commertialOffer?.IsAvailable;

                      if (seller) {
                        // eslint-disable-next-line no-unsafe-optional-chaining
                        price = +seller?.commertialOffer?.ListPrice?.toFixed(2);

                        if (Number.isNaN(price)) {
                          // eslint-disable-next-line no-unsafe-optional-chaining
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
                      };
                    }),
                  ),
                [],
              );
            }),
          )
        )
          .reduce((stack, group) => stack.concat(group), [])
          .reduce((stack: any, item: any) => {
            Object.assign(stack, { [item.itemId]: item });
            return stack;
          }, {});

        fs.writeFileSync('products.json', JSON.stringify(productDetails), 'utf8');

        newEntries = await Promise.all(
          jsonObj?.rss?.channel?.item.map(async (item: any, index: number) => {
            let link = item?.['g:link']?.__cdata || item?.['link']?.__cdata || item?.['link'];

            let price = item?.['g:price'];
            let salePrice = item?.['g:sale_price'];
            const id = item?.['g:id'];

            // add new params
            try {
              const a = new URL(link);
              // a.searchParams.append("region_id", regionId);
              a.searchParams.append('sc', salesChannel);
              link = a.toString();
            } catch (e: any) {
              // @ts-ignore
              console.log('Error parsing URL:', link, e?.message);
            }

            // OMG, this is a hack, but it works
            // - get details from API
            // VTEX doesen't have multiplier in XML: https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI

            // if product exist in list to change value
            if ({}.hasOwnProperty.call(productDetails, `${id}`)) {
              salePrice = productDetails[`${id}`].salePrice;
              price = productDetails[`${id}`].price;
            } else {
              console.log(`SKU id ${id} no found in API`);
            }

            let availability;

            if (isMainFeed) {
              availability = 'out of stock';
            } else {
              availability = productDetails?.[`${id}`]?.availability ? 'in stock' : 'out of stock';
            }

            const isProductVariable =
              (productDetails?.[`${id}`]?.measurementUnit as string)?.toLocaleLowerCase() === 'kg';

            if (complete) {
              return {
                ...item,
                'g:link': link,
                'g:availability': availability,
                ...(isMainFeed
                  ? {
                      'g:price': `${price} BRL`,
                    } // se for main feed, não apresenta região
                  : {
                      // se não for main feed, apresenta preço e região
                      'g:region_id': regionId,
                      'g:price': `${price} BRL`,
                      'g:sale_price': `${salePrice} BRL`,
                    }),
                ...(globalCategory ? { 'g:google_product_category': globalCategory } : {}),
                ...(isProductVariable ? { 'g:gtin': '' } : {}),
              };
            }
            return {
              'g:id': item['g:id'],
              'g:region_id': regionId,
              'g:price': `${price} BRL`,
              'g:sale_price': `${salePrice} BRL`,
              'g:availability': availability,
            };
          }),
        );
      } else {
        console.log('root node <rss> not exist in this XML');
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
        arrayNodeName: 'item',
      };
      const xmlBuilder = new XMLBuilder(optionsEncode);

      const xml = xmlBuilder.build(newEntries);

      fs.writeFileSync(
        file,
        `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
${xml}
</channel>
</rss><!-- transformedBy="vtex-xml-transformer-${version}" region_id="${regionId}" | From VTEX: ${vtexXmlDetails} -->`,
        'utf8',
      );
    } catch (err: any) {
      // @ts-ignore
      console.log('CATCH ERROR XmlTransform', err);
    }
  } else {
    console.log('XMLData is not valid XML');
  }

  return file;
};

export default XmlTransform;
