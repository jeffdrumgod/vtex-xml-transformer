import http from "https";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";

async function Download(url: string, dest: fs.PathLike): Promise<fs.PathLike> {
  // clean download folder
  const tmpFolder = path.dirname(dest as string);
  fs.readdir(tmpFolder, function (err, files) {
    files?.forEach(function (file, index) {
      fs.stat(path.join(tmpFolder, file), function (err, stat) {
        var endTime, now;
        if (err) {
          return console.error(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + 60000 * 10;
        if (now > endTime) {
          return rimraf(path.join(tmpFolder, file), function (err: any) {
            if (err) {
              return console.error(err);
            }
          });
        }
      });
    });
  });

  // download proccess
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest, { flags: "wx" });

    const request = http.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        fs.unlink(dest, () => {}); // Delete temp file
        reject(
          `Server responded with ${response.statusCode}: ${response.statusMessage}`
        );
      }
    });

    request.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });

    file.on("finish", () => {
      resolve(dest);
    });

    file.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });
  });
}

export default Download;
