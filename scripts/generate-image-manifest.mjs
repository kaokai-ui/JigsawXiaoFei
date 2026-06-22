import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SOURCE_IMAGES_DIR = join(projectRoot, 'assets', 'source-images');
const PUBLIC_IMAGES_DIR = join(projectRoot, 'public', 'images');
const GENERATED_DIR = join(projectRoot, 'src', 'generated');
const MANIFEST_PATH = join(GENERATED_DIR, 'imageManifest.ts');

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const THUMBNAIL_MAX_WIDTH = 480;
const WEBP_QUALITY = 82;
const THUMBNAIL_WEBP_QUALITY = 74;
const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 1200;

function slugFromFilename(filename) {
  return filename
    .slice(0, -extname(filename).length)
    .split(/[\\/]/)
    .join('--')
    .replace(/[^a-zA-Z0-9-_]/g, '-');
}

function toUrlPath(filePath) {
  return filePath.split(sep).join('/');
}

async function findImageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findImageFiles(absolutePath));
    } else if (entry.isFile() && IMAGE_EXTENSIONS.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

async function tryRequire(specifier) {
  try {
    return await import(specifier);
  } catch {
    return null;
  }
}

let _sharpAvailable = undefined;
let _imageSizeAvailable = undefined;
let _dimensionWarningLogged = false;

async function getSharpModule() {
  if (_sharpAvailable === undefined) {
    _sharpAvailable = await tryRequire('sharp');
  }
  return _sharpAvailable ? (_sharpAvailable.default || _sharpAvailable) : null;
}

async function getDimensionsWithSharp(filePath) {
  const mod = await getSharpModule();
  if (!mod) return null;
  const meta = await mod(filePath).metadata();
  return { width: meta.width, height: meta.height };
}

async function getDimensionsWithImageSize(filePath) {
  if (_imageSizeAvailable === undefined) {
    _imageSizeAvailable = await tryRequire('image-size');
  }
  if (!_imageSizeAvailable) return null;
  const imageSize = _imageSizeAvailable.default || _imageSizeAvailable;
  const result = imageSize.imageSize || imageSize;
  const dim = typeof result === 'function' ? result(filePath) : imageSize(filePath);
  if (dim instanceof Promise) {
    const resolved = await dim;
    return { width: resolved.width, height: resolved.height };
  }
  return { width: dim.width, height: dim.height };
}

async function getImageDimensions(filePath) {
  const sharpResult = await getDimensionsWithSharp(filePath);
  if (sharpResult) return sharpResult;

  const imageSizeResult = await getDimensionsWithImageSize(filePath);
  if (imageSizeResult) return imageSizeResult;

  if (!_dimensionWarningLogged) {
    _dimensionWarningLogged = true;
    console.warn(
      `[generate-image-manifest] Neither sharp nor image-size available. ` +
        `Using default dimensions (${DEFAULT_WIDTH}x${DEFAULT_HEIGHT}). ` +
        `Install sharp or image-size for accurate dimensions.`,
    );
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

async function encodeWebpWithSharp(srcPath, destPath, options = {}) {
  const mod = await getSharpModule();
  if (!mod) {
    throw new Error(
      '[generate-image-manifest] sharp is required to convert source images to webp. Run npm install first.',
    );
  }

  let pipeline = mod(srcPath);
  if (options.resize) {
    pipeline = pipeline.resize(options.resize);
  }

  await pipeline.webp({ quality: options.quality }).toFile(destPath);
}

async function generateOriginalImage(srcPath, destPath) {
  await encodeWebpWithSharp(srcPath, destPath, {
    quality: WEBP_QUALITY,
  });
}

async function generateThumbnail(srcPath, thumbDestPath) {
  await encodeWebpWithSharp(srcPath, thumbDestPath, {
    resize: { width: THUMBNAIL_MAX_WIDTH, withoutEnlargement: true },
    quality: THUMBNAIL_WEBP_QUALITY,
  });
}

function buildManifestEntry(entry) {
  const aspectRatio = entry.width / entry.height;
  return (
    `  {\n` +
    `    id: '${entry.id}',\n` +
    `    filename: '${entry.filename}',\n` +
    `    src: '${entry.src}',\n` +
    `    thumbnailSrc: '${entry.thumbnailSrc}',\n` +
    `    alt: '${entry.alt}',\n` +
    `    width: ${entry.width},\n` +
    `    height: ${entry.height},\n` +
    `    aspectRatio: ${aspectRatio},\n` +
    `  }`
  );
}

function buildManifestTs(entries) {
  const interfaceBlock = `export interface ImageAsset {
  id: string;
  filename: string;
  src: string;
  thumbnailSrc: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
}`;

  const arrayItems = entries.length > 0 ? '\n' + entries.map(buildManifestEntry).join(',\n') + '\n' : '';
  const arrayBlock = `export const imageManifest: readonly ImageAsset[] = [${arrayItems}] as const;`;

  return `// Auto-generated by scripts/generate-image-manifest.mjs; do not edit manually.\n\n${interfaceBlock}\n\n${arrayBlock}\n`;
}

async function main() {
  // public/images is generated exclusively from source images; recreate it to avoid stale images.
  await rm(PUBLIC_IMAGES_DIR, { recursive: true, force: true });
  await mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  await mkdir(GENERATED_DIR, { recursive: true });

  let imagePaths;
  try {
    imagePaths = await findImageFiles(SOURCE_IMAGES_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(
        `[generate-image-manifest] Source image directory not found at ${SOURCE_IMAGES_DIR}. Generating empty manifest.`,
      );
      await writeFile(MANIFEST_PATH, buildManifestTs([]), 'utf-8');
      return;
    }
    throw err;
  }

  const imageFiles = imagePaths.sort((a, b) => a.localeCompare(b));
  const entries = [];
  const seenIds = new Set();

  for (const srcPath of imageFiles) {
    const relativeFilename = relative(SOURCE_IMAGES_DIR, srcPath);
    const filename = basename(relativeFilename);
    const id = slugFromFilename(relativeFilename);
    if (seenIds.has(id)) {
      throw new Error(
        `[generate-image-manifest] Duplicate slug ID '${id}' from file '${filename}'. ` +
          `Ensure each image filename produces a unique slug.`,
      );
    }
    seenIds.add(id);

    const webpRelativeFilename = join(dirname(relativeFilename), `${id}.webp`);
    const destPath = join(PUBLIC_IMAGES_DIR, webpRelativeFilename);
    const thumbFilename = `${id}-thumb.webp`;
    const thumbDestPath = join(dirname(destPath), thumbFilename);

    await mkdir(dirname(destPath), { recursive: true });
    await generateOriginalImage(srcPath, destPath);
    await generateThumbnail(srcPath, thumbDestPath);

    const dimensions = await getImageDimensions(srcPath);

    entries.push({
      id,
      filename,
      src: `images/${toUrlPath(relative(PUBLIC_IMAGES_DIR, destPath))}`,
      thumbnailSrc: `images/${toUrlPath(relative(PUBLIC_IMAGES_DIR, thumbDestPath))}`,
      alt: id,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  if (entries.length === 0) {
    console.warn(
      '[generate-image-manifest] No images found in assets/source-images/. Generating empty manifest.',
    );
  } else {
    console.log(`[generate-image-manifest] Processed ${entries.length} image(s).`);
  }

  const tsContent = buildManifestTs(entries);
  await writeFile(MANIFEST_PATH, tsContent, 'utf-8');
  console.log(`[generate-image-manifest] Manifest written to ${MANIFEST_PATH}`);
}

await main();
