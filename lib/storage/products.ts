import { createServiceClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

async function ensureBucket() {
  const supabase = createServiceClient();
  const { data } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

export async function uploadProductImage(productId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Image must be JPEG, PNG, WebP, or GIF");
  }

  await ensureBucket();
  const supabase = createServiceClient();
  const path = `${productId}/${crypto.randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
