import { NextRequest, NextResponse } from "next/server";
import { HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, s3Client } from "@/app/utils/constant";

export async function POST(req: NextRequest) {
  try {
    const { key, expectedMd5 } = await req.json();

    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const headResponse = await s3Client.send(headCommand);
    const wasabiEtag = headResponse.ETag?.replace(/"/g, "");
    if (wasabiEtag !== expectedMd5) {
      // ETag mismatch case will delete the file
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      );
      return NextResponse.json(
        { error: "ETag mismatch, file deleted" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
