import { NextRequest, NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { BUCKET_NAME, MAX_FILE_SIZE, s3Client } from "@/app/utils/constant";

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const presignedUrls = await Promise.all(
      files.map(
        async (file: {
          name: string;
          type: string;
          size: number;
          md5: string;
        }) => {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} exceeds max size (20GB)`);
          }

          const key = `uploads/${crypto.randomUUID()}-${file.name}`;

          const { url, fields } = await createPresignedPost(s3Client, {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: 60,
            Fields: { "Content-Type": file.type },
          });

          return { url, fields, key, expectedEtag: file.md5 };
        }
      )
    );

    return NextResponse.json({ presignedUrls });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
