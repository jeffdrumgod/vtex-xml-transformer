import http from 'https';
import fs from 'fs';
import path from 'path';

async function Download(url: string, dest: fs.PathLike): Promise<fs.PathLike> {
  // clean download folder
  const tmpFolder = path.dirname(dest as string);
  fs.readdir(tmpFolder, (_, files) => {
    files?.forEach((file) => {
      fs.stat(path.join(tmpFolder, file), (err, stat) => {
        if (err) {
          console.error(err);
        }
        const now = new Date().getTime();
        const endTime = new Date(stat.ctime).getTime() + 60000 * 10;
        if (now > endTime) {
          // @ts-ignore
          // remove file using fs
          fs.unlink(path.join(tmpFolder, file), (errUnlink) => {
            if (errUnlink) {
              console.error(errUnlink);
            }
          });
        }
      });
    });
  });

  // download proccess
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest, { flags: 'wx' });

    const request = http.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        },
      },
      (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
        } else {
          file.close();
          fs.unlink(dest, () => {}); // Delete temp file
          reject(Error(`Server responded with ${response.statusCode} for ${url}: ${response.statusMessage}`));
        }
      },
    );

    request.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });

    file.on('finish', () => {
      resolve(dest);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });
  });
}

export default Download;
