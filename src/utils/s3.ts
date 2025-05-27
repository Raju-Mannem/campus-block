import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
  } from "@aws-sdk/client-s3";
  import fs from "fs";
  import { promisify } from "util";
  import path from "path";

  
  const unlinkAsync = promisify(fs.unlink);
  
  export const s3Client = new S3Client({ region: process.env.AWS_REGION! });

  function getContentType(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".mpd":
        return "application/dash+xml";
      case ".m4s":
        return "video/iso.segment";
      case ".mp4":
        return "video/mp4";
      case ".pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }
  
  /**
   * Upload a file from disk (Multer diskStorage) to S3.
   * @param file Multer file object (with .path)
   * @param folder S3 folder prefix (default: "course-images")
   * @returns S3 key (string)
   */
  export async function uploadFileToS3(
    file: Express.Multer.File,
    folder = "course-images"
  ): Promise<string> {
    if (!file.path) throw new Error("File path is missing from Multer file object.");
    const s3Key = `${folder}/${Date.now()}_${file.originalname}`;
    const fileStream = fs.createReadStream(file.path);
  
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: s3Key,
        Body: fileStream,
        ContentType: getContentType(file.originalname),
        ACL: "private", // Always private for paid content
      })
    );
  
    // Clean up local temp file
    await unlinkAsync(file.path);
  
    return s3Key;
  }
  
  /**
   * Delete a single object from S3 given its key.
   * @param key S3 object key
   */
  export async function deleteS3Object(key: string) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
    );
  }
  
  /**
   * Delete all objects in S3 under a given prefix (folder).
   * @param prefix S3 folder prefix (e.g., 'videos/uuid/')
   */
  export async function deleteS3Folder(prefix: string) {
    // List all objects under the prefix
    const listed = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET!,
        Prefix: prefix,
      })
    );
    if (!listed.Contents || listed.Contents.length === 0) return;
  
    // Prepare objects for batch delete
    const objects = listed.Contents.map((obj) => ({ Key: obj.Key! }));
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET!,
        Delete: { Objects: objects },
      })
    );
  }
  
/**
 * Recursively upload all files in a local directory to S3 under a given prefix.
 * Supports DASH (manifest.mpd, .m4s segments, etc).
 */
export async function uploadFolderToS3(localDir: string, s3Prefix: string) {
  const files = fs.readdirSync(localDir);
  for (const file of files) {
    const filePath = path.join(localDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively upload subdirectories
      await uploadFolderToS3(filePath, `${s3Prefix}/${file}`);
    } else if (stat.isFile()) {
      const fileStream = fs.createReadStream(filePath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `${s3Prefix}/${file}`,
          Body: fileStream,
          ContentType: getContentType(file),
          ACL: "private", // Always private for streaming content
        })
      );
    }
  }
}
