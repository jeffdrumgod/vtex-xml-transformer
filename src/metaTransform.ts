import fs from 'fs';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import getVersion from 'getVersion';
import fetchProductDetails, { ProductDetail } from 'productDetails';
import buildProductLink, { CustomProductUrlType, UtmOptions } from 'linkBuilder';

const version = getVersion();

export type MetaIdType = 'sku' | 'product';

export type MetaTransformOptions = {
  storeName: string;
  storeDomain: string;
  file: fs.PathLike;
  regionId: string;
  salesChannel: string;
  idType: MetaIdType;
  utm: UtmOptions;
  globalCategory?: string;
  customProductUrlType: CustomProductUrlType;
};

const MOCKUP_SUFFIX = '_mck';
const TITLE_MAX = 200;
const DESCRIPTION_MAX = 9999;
const PRODUCT_TYPE_MAX = 750;

const truncate = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);
const THUMB_SUFFIX = '_tn';

// lê valor de tag com ou sem prefixo g:, com ou sem CDATA
const pick = (item: any, name: string): string | undefined => {
  const raw = item?.[`g:${name}`] ?? item?.[name];
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'object') return raw.__cdata ?? raw['#text'];
  return `${raw}`;
};

const cdata = (value: string) => ({ __cdata: value });

const formatPrice = (value: number | string | undefined): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = +value;
  if (Number.isNaN(n)) return undefined;
  return `${n.toFixed(2)} BRL`;
};

const resolveImages = (detail: ProductDetail | undefined) => {
  const images = detail?.images ?? [];
  const main = images.find((img) => img.imageText?.toLowerCase().endsWith(MOCKUP_SUFFIX)) ?? images[0];
  const additional = images
    .filter((img) => img !== main && !img.imageText?.toLowerCase().endsWith(THUMB_SUFFIX))
    .map((img) => img.imageUrl)
    .filter((url) => !!url);
  return { main: main?.imageUrl, additional };
};

const buildMetaItem = ({
  item,
  detail,
  options,
}: {
  item: any;
  detail: ProductDetail;
  options: MetaTransformOptions;
}) => {
  const { storeDomain, salesChannel, idType, utm, globalCategory, customProductUrlType } = options;

  const skuId = pick(item, 'id') ?? detail.itemId;
  const id = idType === 'product' ? detail.productId : skuId;

  const title = truncate(pick(item, 'title') || detail.productName || '', TITLE_MAX);
  const description = truncate(
    pick(item, 'description') || detail.description || pick(item, 'summary') || detail.metaTagDescription || title,
    DESCRIPTION_MAX,
  );
  const brand = pick(item, 'brand') || detail.brand;
  const condition = pick(item, 'condition') || 'new';
  const productType = truncate(pick(item, 'product_type') ?? '', PRODUCT_TYPE_MAX);
  const googleCategory = globalCategory || pick(item, 'google_product_category');
  const mpn = pick(item, 'mpn') || detail.productReference;
  const isProductVariable = (detail.measurementUnit ?? '').toLowerCase() === 'kg';
  const gtin = isProductVariable ? '' : pick(item, 'gtin') || detail.ean || '';

  const link = buildProductLink({
    link: pick(item, 'link') ?? '',
    storeDomain,
    salesChannel,
    customProductUrlType,
    utm,
    replaceSalesChannel: true,
  });

  const { main: imageLink, additional } = resolveImages(detail);

  // Meta exige sale_price menor que price. Igual ou maior gera aviso, então omite
  const hasSale = detail.salePrice !== undefined && detail.price !== undefined && +detail.salePrice < +detail.price;

  return {
    'g:id': id,
    'g:item_group_id': detail.productId,
    'g:title': cdata(title),
    'g:description': cdata(description),
    'g:availability': detail.availability ? 'in stock' : 'out of stock',
    'g:condition': condition,
    'g:price': formatPrice(detail.price),
    ...(hasSale ? { 'g:sale_price': formatPrice(detail.salePrice) } : {}),
    'g:link': cdata(link),
    'g:image_link': cdata(imageLink || pick(item, 'image_link') || ''),
    ...(additional.length ? { 'g:additional_image_link': additional.map(cdata) } : {}),
    'g:brand': cdata(brand),
    ...(gtin ? { 'g:gtin': gtin } : {}),
    ...(mpn ? { 'g:mpn': mpn } : {}),
    ...(googleCategory ? { 'g:google_product_category': cdata(googleCategory) } : {}),
    ...(productType ? { 'g:product_type': cdata(productType) } : {}),
  };
};

const MetaTransform = async (options: MetaTransformOptions): Promise<fs.PathLike> => {
  const { file, storeName, salesChannel, regionId, idType } = options;
  const xmlData = fs.readFileSync(file, 'utf8');

  const optionsDecode = {
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    cdataPropName: '__cdata',
    parseTagValue: false, // preserva zeros à esquerda em gtin/id
    parseAttributeValue: false,
    trimValues: true,
  };

  const lastLine = xmlData.trimEnd().split('\n').pop() ?? '';
  const commentMatch = lastLine.match(/<!--(.*?)-->/);
  // "--" não pode existir dentro de comentário XML
  const vtexXmlDetails = (commentMatch?.[1] ?? ' no details ').replace(/-{2,}/g, '-');
  console.log('[meta] Start XML reading and validation');

  const validated = XMLValidator.validate(xmlData);
  if (validated !== true) {
    throw new Error('[meta] XMLData is not valid XML');
  }

  let entries: any[] = [];

  try {
    const xmlParser = new XMLParser(optionsDecode);
    const jsonObj = xmlParser.parse(xmlData);

    let items = jsonObj?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];

    if (!items.length) {
      console.log('[meta] no <item> found in XML');
    } else {
      const skuIds = items.map((item: any) => `${pick(item, 'id') ?? ''}`).filter((i: string) => !!i);
      const productDetails = await fetchProductDetails({ storeName, salesChannel, skuIds });

      const seen = new Set<string>();
      let discardedNoApi = 0;
      let discardedDuplicate = 0;

      // RN04: SKU fora da API (com sc) = inativo/indisponível na região, descarta
      // RN01: id único. Com idType=product, prioriza SKU disponível
      const candidates = items
        .map((item: any) => ({ item, detail: productDetails[`${pick(item, 'id')}`] }))
        .filter(({ item, detail }: any) => {
          if (!detail) {
            discardedNoApi += 1;
            console.log(`[meta] SKU id ${pick(item, 'id')} not found in API, discarded`);
            return false;
          }
          return true;
        });

      if (idType === 'product') {
        candidates.sort((a: any, b: any) => Number(!!b.detail.availability) - Number(!!a.detail.availability));
      }

      let discardedInvalid = 0;
      const REQUIRED = ['g:id', 'g:title', 'g:description', 'g:price', 'g:link', 'g:image_link', 'g:brand'];
      const valueOf = (v: any) => (v && typeof v === 'object' ? v.__cdata : v);

      entries = candidates
        .map(({ item, detail }: any) => buildMetaItem({ item, detail, options }))
        .filter((entry: any) => {
          const missing = REQUIRED.filter((key) => !valueOf(entry[key]));
          if (missing.length) {
            discardedInvalid += 1;
            console.log(`[meta] SKU id ${entry['g:id']} discarded, missing: ${missing.join(', ')}`);
            return false;
          }
          return true;
        })
        .filter((entry: any) => {
          const key = `${entry['g:id']}`;
          if (seen.has(key)) {
            discardedDuplicate += 1;
            return false;
          }
          seen.add(key);
          return true;
        });

      console.log(
        `[meta] items: ${items.length}, exported: ${entries.length}, discardedNoApi: ${discardedNoApi}, discardedInvalid: ${discardedInvalid}, discardedDuplicate: ${discardedDuplicate}`,
      );
    }

    const xmlBuilder = new XMLBuilder({
      cdataPropName: '__cdata',
    });

    // um <item> por linha: Meta limita cada linha do XML em 5 MB
    const xml = entries.map((entry) => `    ${xmlBuilder.build({ item: entry })}`).join('\n');

    fs.writeFileSync(
      file,
      `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
${xml}
</channel>
</rss><!-- transformedBy="vtex-xml-transformer-${version}" format="meta" region_id="${regionId}" sc="${salesChannel}" idType="${idType}" | From VTEX: ${vtexXmlDetails} -->`,
      'utf8',
    );
  } catch (err: any) {
    console.log('[meta] CATCH ERROR MetaTransform', err);
    throw err;
  }

  return file;
};

export default MetaTransform;
