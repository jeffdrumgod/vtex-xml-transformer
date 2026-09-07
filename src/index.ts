import http from 'http';
import fs from 'fs';
import { resolve } from 'path';
import Url from 'url';
import Download from './download';
import RequestHandler, { ROUTES } from './requestHandler';
import XmlTransform from './xmlTransform';
import MetaTransform from './metaTransform';

const port = 8000;

const getRemoteVtexXml = async ({
  storeDomain,
  storeName,
  xmlName,
  salesChannel,
}: {
  storeDomain: string;
  storeName: string;
  xmlName: string;
  salesChannel: string;
}): Promise<fs.PathLike> => {
  const time = new Date().getTime();
  const file = resolve('./tmp', `${storeName}-${xmlName}-${time}.xml`);
  const url = `https://${storeDomain}/XMLData/${xmlName}.xml?sc=${salesChannel}`;
  console.log(`Downloading XML from: ${url}`);
  const savedFile = await Download(url, file);
  return savedFile;
};

const server = http.createServer(RequestHandler);
let requestCounter = 0;

server.on('request', async (req, res) => {
  if (res.writableEnded) {
    return;
  }

  const { headers, method, url } = req;
  const urlParsed = Url.parse(url ?? '', true);
  const queryObject = urlParsed.query;
  const pathname = urlParsed.pathname || '';

  requestCounter += 1;
  console.log(`Request (${requestCounter}) - START: ${url}`);
  try {
    const fileName = await getRemoteVtexXml(
      queryObject as {
        storeDomain: string;
        storeName: string;
        xmlName: string;
        salesChannel: string;
      },
    );

    console.log(`File downloaded: ${fileName}`);

    const fileNameTransformed =
      pathname === ROUTES.meta
        ? await MetaTransform({
            file: fileName,
            storeName: (queryObject?.storeName ?? '') as string,
            storeDomain: (queryObject?.storeDomain ?? '') as string,
            regionId: (queryObject?.regionId ?? '') as string,
            salesChannel: (queryObject?.salesChannel ?? '') as string,
            idType: (queryObject?.idType === 'product' ? 'product' : 'sku') as 'sku' | 'product',
            utm: {
              keepUtm: !['0', 'false'].includes(`${queryObject?.utm ?? '1'}`),
              utmSource: queryObject?.utmSource as string | undefined,
              utmMedium: queryObject?.utmMedium as string | undefined,
              utmCampaign: queryObject?.utmCampaign as string | undefined,
            },
            globalCategory: queryObject?.globalCategory as string | undefined,
            customProductUrlType: queryObject?.customProductUrlType as any,
          })
        : await XmlTransform({
            file: fileName,
            storeName: (queryObject?.storeName ?? '') as string,
            storeDomain: (queryObject?.storeDomain ?? '') as string,
            regionId: (queryObject?.regionId ?? '') as string,
            salesChannel: (queryObject?.salesChannel ?? '') as string,
            complete: !!queryObject?.complete,
            isMainFeed: !!queryObject?.isMainFeed,
            globalCategory: queryObject?.globalCategory as string,
            customProductUrlType: queryObject?.customProductUrlType as any,
          });
    const stat = fs.statSync(fileNameTransformed);

    const readStream = fs.createReadStream(fileNameTransformed);
    readStream.on('open', () =>
      res.writeHead(200, {
        'Content-Type': 'text/xml',
        'Content-Length': stat.size,
      }),
    );
    readStream.pipe(res);
  } catch (err) {
    res.statusCode = 500;
    console.log(err);
    console.log(
      'ERR:',
      JSON.stringify({
        headers,
        method,
        url,
        err,
      }),
    );
    res.end('Error');
  }
  console.log(`Request (${requestCounter}) - END: ${url}`);
});

server.listen(port, () => {
  console.log(`Server up on port ${port}`);
});

server.timeout = 300000; //  5 minutes
