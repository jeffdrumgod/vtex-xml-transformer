import fs from 'fs';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';
import Axios from 'axios';

const api = setupCache(Axios, {
  debug: console.log,
  storage: buildMemoryStorage(),
  ttl: 1000 * 60 * 1, // 1 minute
});

export type ProductImage = {
  imageId: string;
  imageText: string;
  imageUrl: string;
};

export type ProductDetail = {
  ean: string;
  itemId: string;
  unitMultiplier: number;
  measurementUnit: string;
  price: number | string | undefined;
  salePrice: number | undefined;
  availability: boolean | undefined;
  productId: string;
  productName: string;
  description: string;
  metaTagDescription: string;
  brand: string;
  productReference: string;
  linkText: string;
  images: ProductImage[];
};

export type ProductDetailsMap = Record<string, ProductDetail>;

const CHUNK_SIZE = 50;

/**
 * Busca detalhes dos SKUs na API de catálogo da VTEX (chunks de 50).
 * Retorna mapa indexado por skuId.
 * VTEX não aplica unitMultiplier no XML, por isso preço vem daqui:
 * https://help.vtex.com/pt/known-issues/xml-loads-product-price-without-multiplier--3B1Vi8l3gICcqKuqcAoKqI
 */
const fetchProductDetails = async ({
  storeName,
  salesChannel,
  skuIds,
}: {
  storeName: string;
  salesChannel: string;
  skuIds: string[];
}): Promise<ProductDetailsMap> => {
  const skuList = [...skuIds];
  const chunks = [...Array(Math.ceil(skuList.length / CHUNK_SIZE))].map(() => skuList.splice(0, CHUNK_SIZE));

  const groups = await Promise.all(
    chunks.map(async (chunk: string[]) => {
      const urlSearch = `https://${storeName}.myvtex.com/api/catalog_system/pub/products/search/?_from=0&_to=49&${chunk
        .map((i) => `fq=skuId:${i}`)
        .join('&')}&sc=${salesChannel}`;

      const response = (await api.get(urlSearch)) as any;

      if (!response?.data?.length) {
        console.log(`API response is empty for ${urlSearch}`);
        return [];
      }

      return response.data.reduce(
        (stack: ProductDetail[], product: any) =>
          stack.concat(
            product.items.map((sku: any): ProductDetail => {
              const { unitMultiplier, sellers, itemId, ean, measurementUnit, images } = sku;
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
                productId: `${product.productId ?? ''}`,
                productName: product.productName ?? '',
                description: product.description ?? '',
                metaTagDescription: product.metaTagDescription ?? '',
                brand: product.brand ?? '',
                productReference: product.productReference ?? '',
                linkText: product.linkText ?? '',
                images: (images ?? []).map((img: any) => ({
                  imageId: `${img.imageId ?? ''}`,
                  imageText: img.imageText ?? '',
                  imageUrl: img.imageUrl ?? '',
                })),
              };
            }),
          ),
        [],
      );
    }),
  );

  const details: ProductDetailsMap = groups
    .reduce((stack, group) => stack.concat(group), [] as ProductDetail[])
    .reduce((stack: ProductDetailsMap, item: ProductDetail) => {
      Object.assign(stack, { [item.itemId]: item });
      return stack;
    }, {});

  return details;
};

export default fetchProductDetails;
