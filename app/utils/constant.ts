import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET_NAME = process.env.WASABI_BUCKET_NAME!;
export const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024;

const REGION = process.env.WASABI_REGION!;
const ACCESS_KEY = process.env.WASABI_ACCESS_KEY!;
const SECRET_KEY = process.env.WASABI_SECRET_KEY!;

export const s3Client = new S3Client({
  region: REGION,
  endpoint: `https://s3.${REGION}.wasabisys.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});
