import http from 'http';
import fs from 'fs';
import { resolve } from 'path';
import Url from 'url';
import Download from './download';
import RequestHandler, { ROUTES } from './requestHandler';
import XmlTransform from './xmlTransform';
import MetaTransform from './metaTransform';
import { parseImageSelector } from './imageSelector';
import { UtmOptions } from './linkBuilder';

const port = Number(process.env.PORT) || 8000;

// XML vem direto do host VTEX da conta. storeDomain fica só pros links do produto:
// a borda (CDN) do domínio da loja pode não encaminhar /XMLData/ pra VTEX
const getRemoteVtexXml = async ({
  storeName,
  xmlName,
  salesChannel,
}: {
  storeName: string;
  xmlName: string;
  salesChannel: string;
}): Promise<fs.PathLike> => {
  const time = new Date().getTime();
  const file = resolve('./tmp', `${storeName}-${xmlName}-${time}.xml`);
  const url = `https://${storeName}.vtexcommercestable.com.br/XMLData/${xmlName}.xml?sc=${salesChannel}`;
  console.log(`Downloading XML from: ${url}`);
  const savedFile = await Download(url, file);
  return savedFile;
};

// utm=0 remove utm_*; default mantém utm_* do XML e só sobrescreve o que for enviado
const parseUtm = (query: Record<string, unknown>): UtmOptions => ({
  keepUtm: !['0', 'false'].includes(`${query?.utm ?? '1'}`),
  utmSource: query?.utmSource as string | undefined,
  utmMedium: query?.utmMedium as string | undefined,
  utmCampaign: query?.utmCampaign as string | undefined,
  utmContent: query?.utmContent as string | undefined,
});

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
            utm: parseUtm(queryObject),
            globalCategory: queryObject?.globalCategory as string | undefined,
            customProductUrlType: queryObject?.customProductUrlType as any,
            imageSelector: parseImageSelector(queryObject),
          })
        : await XmlTransform({
            file: fileName,
            storeName: (queryObject?.storeName ?? '') as string,
            storeDomain: (queryObject?.storeDomain ?? '') as string,
            regionId: (queryObject?.regionId ?? '') as string,
            salesChannel: (queryObject?.salesChannel ?? '') as string,
            complete: !!queryObject?.complete,
            isMainFeed: !!queryObject?.isMainFeed,
            feedLabel: (queryObject?.feedLabel as string | undefined) || undefined,
            utm: parseUtm(queryObject),
            globalCategory: queryObject?.globalCategory as string,
            customProductUrlType: queryObject?.customProductUrlType as any,
            imageSelector: parseImageSelector(queryObject),
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
