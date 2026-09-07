import { URL } from 'url';

export type CustomProductUrlType = undefined | 'prefix-detail';

export type UtmOptions = {
  keepUtm?: boolean; // default true. false remove todos os utm_*
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export const formatProductPathUrl = (urlObject: URL, customTypeFormat: CustomProductUrlType) => {
  // get slug os product from default VTEX URL (/p)
  const slug =
    urlObject.pathname
      .split('/')
      .filter((i) => !!i)
      .at(0) ?? '';
  switch (customTypeFormat) {
    case 'prefix-detail':
      return `/detail/${slug}`;
    default:
      return urlObject.pathname;
  }
};

const applyUtm = (urlObject: URL, utm: UtmOptions) => {
  if (utm.keepUtm === false) {
    [...urlObject.searchParams.keys()]
      .filter((key) => key.toLowerCase().startsWith('utm_'))
      .forEach((key) => urlObject.searchParams.delete(key));
    return;
  }

  if (utm.utmSource) urlObject.searchParams.set('utm_source', utm.utmSource);
  if (utm.utmMedium) urlObject.searchParams.set('utm_medium', utm.utmMedium);
  if (utm.utmCampaign) urlObject.searchParams.set('utm_campaign', utm.utmCampaign);
};

/**
 * Reescreve link do produto: host da loja, path customizado, sc e utm.
 * Sem opção de utm, mantém comportamento original (Google): só sc + host + path.
 */
const buildProductLink = ({
  link,
  storeDomain,
  salesChannel,
  customProductUrlType,
  utm,
  replaceSalesChannel = false,
}: {
  link: string;
  storeDomain: string;
  salesChannel: string;
  customProductUrlType: CustomProductUrlType;
  utm?: UtmOptions;
  replaceSalesChannel?: boolean; // true = substitui sc existente. false = append (comportamento Google original)
}): string => {
  try {
    const a = new URL(link);
    if (replaceSalesChannel) {
      a.searchParams.set('sc', salesChannel);
    } else {
      a.searchParams.append('sc', salesChannel);
    }
    a.hostname = storeDomain;
    a.pathname = formatProductPathUrl(a, customProductUrlType);
    if (utm) {
      applyUtm(a, utm);
    }
    return a.toString();
  } catch (e: any) {
    console.log('Error parsing URL:', link, e?.message);
    return link;
  }
};

export default buildProductLink;
