import fs from 'node:fs';
import path from "node:path";

type FileEntry = {
  filename: string;
  buffer: Buffer;
};

export async function writeJsonToJobFolder(jobId: string, fileName: string, data: any): Promise<void> {
  const jobFolder = path.resolve(process.cwd(), 'jobs', jobId);
  // Ensure jobs and jobId folder exist
  fs.mkdirSync(jobFolder, { recursive: true });
  const filePath = path.join(jobFolder, fileName);

  // Write original file
  fs.writeFileSync(filePath, data);
}

export async function readImagesFromJobFolder(jobId: string): Promise<FileEntry[]> {
  const baseJobsPath = path.resolve(process.cwd(), 'jobs'); // Adjust '..' as needed
  const jobFolder = path.join(baseJobsPath, jobId);
  const fileNames = fs.readdirSync(jobFolder);
  const imageFiles = fileNames.filter(name => /\.(jpe?g|png|webp)$/i.test(name));

  return imageFiles.map(file => ({
    filename: file,
    buffer: fs.readFileSync(path.join(jobFolder, file)),
  }));
}

export function deleteJobFolder(jobId: string) {
  const jobFolder = path.resolve(process.cwd(), 'jobs', jobId);

  if (fs.existsSync(jobFolder)) {
    fs.rmSync(jobFolder, { recursive: true, force: true });
    // console.log(`Deleted job folder: ${jobFolder}`);
  } else {
    console.warn(`Job folder not found: ${jobFolder}`);
  }
}