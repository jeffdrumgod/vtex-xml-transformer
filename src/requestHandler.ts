import getVersion from 'getVersion';
import http from 'http';
import Url from 'url';

const version = getVersion();

export const ROUTES = {
  status: '/status',
  google: '/xml-parse',
  meta: '/xml-parse-meta',
} as const;

const REQUIRED_PARAMS: Record<string, string[]> = {
  [ROUTES.google]: ['storeDomain', 'storeName', 'xmlName', 'regionId', 'salesChannel'],
  [ROUTES.meta]: ['storeDomain', 'storeName', 'xmlName', 'salesChannel'],
};

const RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const urlParsed = Url.parse(req?.url ?? '', true);
  const queryObject = urlParsed.query;
  const pathname = urlParsed?.pathname || '';

  if (req.method !== 'GET' || !Object.values(ROUTES).includes(pathname as any)) {
    res.statusCode = 404;
    res.end('Method or end-point not allowed');
    return;
  }

  if (pathname === ROUTES.status) {
    res.statusCode = 200;
    res.end(`ok - ${version}`);
    return;
  }

  const requiredParams = REQUIRED_PARAMS[pathname] ?? [];

  // eslint-disable-next-line no-restricted-syntax
  for (const param of requiredParams) {
    if (!queryObject[param]) {
      res.statusCode = 400;
      res.end(`Missing required parameter: ${param}`);
      return;
    }
  }

  if (pathname === ROUTES.meta) {
    const idType = queryObject.idType;
    if (idType && !['sku', 'product'].includes(`${idType}`)) {
      res.statusCode = 400;
      res.end('Invalid parameter idType: expected "sku" or "product"');
      return;
    }
  }

  if (pathname === ROUTES.google) {
    const { feedLabel } = queryObject;
    if (Array.isArray(feedLabel)) {
      res.statusCode = 400;
      res.end('Parameter feedLabel must not be repeated');
      return;
    }
    // mesmo formato do rótulo de feed do Merchant (letras, dígitos, hífen, underscore, até 20)
    if (feedLabel !== undefined && !/^[A-Za-z0-9_-]{1,20}$/.test(`${feedLabel}`)) {
      res.statusCode = 400;
      res.end('Invalid parameter feedLabel: expected 1-20 chars (letters, digits, hyphen or underscore)');
      return;
    }
  }

  // imageIndex / imageMatch: valem para meta e google, mutuamente exclusivos
  const { imageIndex, imageMatch } = queryObject;
  const hasIndex = imageIndex !== undefined && `${imageIndex}` !== '';
  const hasMatch = imageMatch !== undefined;

  if (Array.isArray(imageIndex) || Array.isArray(imageMatch)) {
    res.statusCode = 400;
    res.end('Parameters imageIndex and imageMatch must not be repeated');
    return;
  }

  if (hasIndex && hasMatch) {
    res.statusCode = 400;
    res.end('Parameters imageIndex and imageMatch are mutually exclusive');
    return;
  }

  if (hasIndex && !/^\d+$/.test(`${imageIndex}`)) {
    res.statusCode = 400;
    res.end('Invalid parameter imageIndex: expected integer >= 0');
    return;
  }

  if (hasMatch && `${imageMatch}`.trim() === '') {
    res.statusCode = 400;
    res.end('Invalid parameter imageMatch: expected non-empty text');
  }
};

export default RequestHandler;
