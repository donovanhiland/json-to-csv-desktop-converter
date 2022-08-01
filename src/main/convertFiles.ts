import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import { Transform } from 'json2csv';
import path from 'path';
import { FileQueueItem } from 'types';

const send = (channel: string, ...args: any[]) => {
  /**
   * We only support 1 right now
   */
  const [window] = BrowserWindow.getAllWindows();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (window) {
    window.webContents.send(channel, ...args);
  }
};

const fileConversionStarted = (
  id: string,
  pendingResults: { name: string; path: string }
) => {
  send('file-queue-item-started', { id, csv: pendingResults });
};
const fileConversionComplete = (
  id: string,
  results: { name: string; path: string; size: number }
) => {
  send('file-queue-item-complete', { id, csv: results });
};

const convertFiles = async (files: FileQueueItem[], outputDir: string) => {
  const tempCsvDirPath = path.join(app.getPath('temp'), 'json2csv-converter');

  if (!fs.existsSync(tempCsvDirPath)) {
    fs.mkdirSync(tempCsvDirPath);
  }

  return Promise.all(
    files.map((file) => {
      return new Promise<FileQueueItem>((resolve) => {
        const jsonFile = file.json;
        const filePathInfo = path.parse(jsonFile.name);
        const csvFileName = `${filePathInfo.name}.csv`;
        const tempOutputPath = path.join(tempCsvDirPath, csvFileName);
        const outputPath = path.join(outputDir, csvFileName);

        const input = fs.createReadStream(jsonFile.path, { encoding: 'utf8' });
        const json2csv = new Transform();
        const output = fs.createWriteStream(tempOutputPath, {
          encoding: 'utf8',
        });
        const csvStream = input.pipe(json2csv).pipe(output);

        const pendingCsvInfo = {
          name: csvFileName,
          path: outputPath,
        };

        fileConversionStarted(file.id, pendingCsvInfo);

        csvStream.on('finish', () => {
          fs.rename(tempOutputPath, outputPath, () => {
            const fileStat = fs.statSync(outputPath);
            const csvInfo = {
              ...pendingCsvInfo,
              size: fileStat.size,
            };
            fileConversionComplete(file.id, csvInfo);
            resolve({
              ...file,
              csv: csvInfo,
            });
          });
        });
      });
    })
  );
};

export { convertFiles };
