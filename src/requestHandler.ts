import getVersion from 'getVersion';
import http from 'http';
import Url from 'url';

const version = getVersion();

const RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const urlParsed = Url.parse(req?.url ?? '', true);
  const queryObject = urlParsed.query;
  if (req.method !== 'GET' || !['/xml-parse', '/status'].includes(urlParsed?.pathname || '')) {
    res.statusCode = 404;
    res.end('Method or end-point not allowed');
    return;
  }

  if (urlParsed?.pathname === '/status') {
    res.statusCode = 200;
    res.end(`ok - ${version}`);
    return;
  }

  if (urlParsed?.pathname === '/xml-parse') {
    const requiredParams = ['storeDomain', 'storeName', 'xmlName', 'regionId', 'salesChannel'];

    // eslint-disable-next-line no-restricted-syntax
    for (const param of requiredParams) {
      if (!queryObject[param]) {
        res.statusCode = 400;
        res.end(`Missing required parameter: ${param}`);
        return;
      }
    }
  }

  // req.pipe(res);
};

export default RequestHandler;
