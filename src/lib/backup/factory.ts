import { getSetting } from "$lib/settings";
import { LocalStorage, type BackupStorage } from "./storage";
import { S3Storage } from "./s3-storage";

const LOCAL_DEFAULT_DIR = process.env.FORJA_BACKUP_DIR ?? "/app/data/backups";

let cachedStorage: { instance: BackupStorage; driverKey: string } | null = null;

export function invalidateStorageCache(): void {
  cachedStorage = null;
}

export async function getStorage(): Promise<BackupStorage> {
  const driver = (await getSetting("chest.storage.driver")) ?? "local";
  if (cachedStorage && cachedStorage.driverKey === driver) return cachedStorage.instance;

  let instance: BackupStorage;
  if (driver === "s3") {
    const [region, bucket, accessKeyId, secretAccessKey, endpoint, pathPrefix, forcePathStyleRaw] = await Promise.all([
      getSetting("chest.storage.s3.region"),
      getSetting("chest.storage.s3.bucket"),
      getSetting("chest.storage.s3.access_key"),
      getSetting("chest.storage.s3.secret_key"),
      getSetting("chest.storage.s3.endpoint"),
      getSetting("chest.storage.s3.path_prefix"),
      getSetting("chest.storage.s3.force_path_style")
    ]);
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error("s3 driver requer region, bucket, access_key, secret_key em Settings");
    }
    instance = new S3Storage({
      region, bucket, accessKeyId, secretAccessKey,
      endpoint: endpoint ?? undefined,
      pathPrefix: pathPrefix ?? undefined,
      forcePathStyle: forcePathStyleRaw === "true"
    });
  } else {
    const dir = (await getSetting("chest.storage.local.dir")) ?? LOCAL_DEFAULT_DIR;
    instance = new LocalStorage(dir);
  }

  cachedStorage = { instance, driverKey: driver };
  return instance;
}
