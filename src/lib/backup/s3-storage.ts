import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";
import type { BackupStorage, BackupObject } from "./storage";

export interface S3Config {
  endpoint?: string;     // optional for R2/B2/MinIO
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  pathPrefix?: string;   // e.g. "chest-backups/"
  forcePathStyle?: boolean; // true for MinIO
}

export class S3Storage implements BackupStorage {
  readonly driver = "s3";
  private client: S3Client;
  private prefix: string;

  constructor(private cfg: S3Config) {
    this.client = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      forcePathStyle: cfg.forcePathStyle ?? false
    });
    this.prefix = cfg.pathPrefix ? cfg.pathPrefix.replace(/^\/+|\/+$/g, "") + "/" : "";
  }

  private k(key: string): string {
    return this.prefix + key;
  }

  async put(key: string, stream: NodeJS.ReadableStream): Promise<{ sizeBytes: number }> {
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.cfg.bucket, Key: this.k(key), Body: stream as Readable }
    });
    await upload.done();
    // get size with HEAD
    const head = await this.client.send(new ListObjectsV2Command({ Bucket: this.cfg.bucket, Prefix: this.k(key), MaxKeys: 1 }));
    const obj = head.Contents?.[0];
    return { sizeBytes: obj?.Size ?? 0 };
  }

  async get(key: string): Promise<NodeJS.ReadableStream> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: this.k(key) }));
    if (!res.Body) throw new Error("S3 GetObject: empty body");
    return res.Body as NodeJS.ReadableStream;
  }

  async list(prefixFilter?: string): Promise<BackupObject[]> {
    const fullPrefix = this.prefix + (prefixFilter ?? "");
    const out: BackupObject[] = [];
    let continuationToken: string | undefined;
    do {
      const res = await this.client.send(new ListObjectsV2Command({
        Bucket: this.cfg.bucket,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken
      }));
      for (const obj of res.Contents ?? []) {
        if (!obj.Key) continue;
        const stripped = obj.Key.startsWith(this.prefix) ? obj.Key.slice(this.prefix.length) : obj.Key;
        out.push({
          key: stripped,
          sizeBytes: obj.Size ?? 0,
          createdAt: Math.floor((obj.LastModified?.getTime() ?? 0) / 1000)
        });
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
    return out;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: this.k(key) }));
  }

  async ping(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.cfg.bucket }));
      const endpointTag = this.cfg.endpoint ? ` (${this.cfg.endpoint})` : "";
      return { ok: true, message: `s3${endpointTag}: bucket ${this.cfg.bucket} reachable` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "unknown" };
    }
  }
}
