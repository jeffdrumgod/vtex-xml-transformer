import fs from 'fs';

const getVersion = (): string => {
  let version;
  try {
    // validate if exist package.json
    if (fs.statSync('./package.json')) {
      const jsonFile = process.env.NODE_ENV === 'production'
        ? './package.json'
        : '../package.json';

      version = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).version;
    } else {
      version = 'unknown';
    }
  } catch (e) {
    version = 'unknown';
  }

  return version;
};

export default getVersion;
