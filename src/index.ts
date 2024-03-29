import http from 'http';
import fs from 'fs';
import { resolve } from 'path';
import Url from 'url';
import Download from './download';
import RequestHandler from './requestHandler';
import XmlTransform from './xmlTransform';

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
  const savedFile = await Download(`https://${storeDomain}/XMLData/${xmlName}.xml?sc=${salesChannel}`, file);
  return savedFile;
};

const server = http.createServer(RequestHandler);
let requestCounter = 0;

server.on('request', async (req, res) => {
  if (res.writableEnded) {
    return;
  }

  const { headers, method, url } = req;
  const queryObject = Url.parse(url ?? '', true).query;

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

    const fileNameTransformed = await XmlTransform({
      file: fileName,
      storeName: (queryObject?.storeName ?? '') as string,
      regionId: (queryObject?.regionId ?? '') as string,
      salesChannel: (queryObject?.salesChannel ?? '') as string,
      complete: !!queryObject?.complete,
      isMainFeed: !!queryObject?.isMainFeed,
      globalCategory: queryObject?.globalCategory as string,
    });
    const stat = fs.statSync(fileNameTransformed);

    const readStream = fs.createReadStream(fileNameTransformed);
    readStream.on('open', () => res.writeHead(200, {
      'Content-Type': 'text/xml',
      'Content-Length': stat.size,
    }));
    readStream.pipe(res);
  } catch (err) {
    res.statusCode = 500;
    res.end('Error');
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
  }
  console.log(`Request (${requestCounter}) - END: ${url}`);
});

server.listen(port, () => {
  console.log(`Server up on port ${port}`);
});

server.timeout = 300000; //  5 minutes
