import { s3Client } from "@/app/utils/constant";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.WASABI_BUCKET_NAME!,
    });

    const data = await s3Client.send(command);

    const files =
      data.Contents?.map((file) => ({
        key: file.Key!,
        lastModified: file.LastModified!,
        size: file.Size!,
      })) || [];

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing files", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
