import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET_NAME, MAX_FILE_SIZE, s3Client } from "@/app/utils/constant";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const fileMetadata = await s3Client.send(headCommand);

    const fileSize = fileMetadata.ContentLength || 0;
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the maximum allowed size of 20GB" },
        { status: 400 }
      );
    }

    // Gen a pre-signed URL
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return NextResponse.json({ url: signedUrl });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
