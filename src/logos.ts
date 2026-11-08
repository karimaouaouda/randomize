export function sanitizeLogos(
  value: unknown,
  names: string[],
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([name, logo]) =>
        names.includes(name) &&
        typeof logo === "string" &&
        logo.length <= 50000 &&
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo),
    ),
  );
}

export async function prepareLogo(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPG, or WebP logo.");
  }
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Choose a logo smaller than 5 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Try another logo.");
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not process this logo.");
    const scale = Math.min(128 / bitmap.width, 128 / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (128 - width) / 2,
      (128 - height) / 2,
      width,
      height,
    );
    const logo = canvas.toDataURL("image/webp", 0.82);
    if (logo.length > 50000)
      throw new Error("This logo is too detailed. Try a simpler image.");
    return logo;
  } finally {
    bitmap.close();
  }
}
