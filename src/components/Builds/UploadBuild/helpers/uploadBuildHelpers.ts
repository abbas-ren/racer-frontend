/**
 * Pure helper functions for upload build file validation.
 * No React state or side effects.
 */

export const MAX_FILE_SIZE_MB = 10000;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface FileValidationErrors {
  errors: Record<string, string>;
}

/**
 * Parse a build filename into device type and version.
 * Expected format: [device_type]__version.zip
 */
export function parseBuildFilename(fileName: string): {
  deviceType: string;
  version: string;
} | null {
  const name = fileName.toLowerCase();
  const base = name.endsWith('.zip') ? name.slice(0, -4) : name;
  const parts = base.split('__');

  if (parts.length < 2) return null;

  const deviceType = parts[0];
  let version = parts[1];
  if (!version.startsWith('v')) version = `v${version}`;

  return { deviceType, version };
}

/**
 * Validate a list of files for duplicates, type, and size constraints.
 * Returns per-file errors keyed by a stable file key.
 */
export function validateFiles(
  files: File[],
  getFileKey: (file: File) => string,
): FileValidationErrors {
  const fileNames = new Map<string, string[]>();
  const errors: Record<string, string> = {};

  files.forEach((f) => {
    const fileKey = getFileKey(f);
    const existing = fileNames.get(f.name) ?? [];
    existing.push(fileKey);
    fileNames.set(f.name, existing);
  });

  files.forEach((f) => {
    const fileKey = getFileKey(f);
    const duplicates = fileNames.get(f.name) ?? [];
    if (duplicates.length > 1) {
      errors[fileKey] = `Duplicate file: ${f.name}`;
    }

    if (!f.name.toLowerCase().endsWith('.zip')) {
      errors[fileKey] = 'Only .zip files are supported';
    }

    if (f.size > MAX_FILE_SIZE) {
      errors[fileKey] =
        `File exceeds ${MAX_FILE_SIZE_MB} MB limit (${(f.size / (1024 * 1024)).toFixed(1)} MB)`;
    }
  });

  return { errors };
}

/**
 * Validate filename format for build naming convention.
 */
export function validateFilenameFormat(fileName: string): string | null {
  const parsed = parseBuildFilename(fileName);
  if (!parsed) {
    return 'Invalid filename. Expected [device_type]__version.zip';
  }
  return null;
}

/**
 * Check for duplicate tags across all files.
 */
export function findDuplicateTags(
  tags: Record<string, string>,
  currentFileName: string,
  currentValue: string,
): boolean {
  const tagValues = Object.entries({ ...tags, [currentFileName]: currentValue })
    .filter(([, val]) => val && val.trim())
    .map(([, val]) => val.trim().toLowerCase());

  const duplicates = tagValues.filter(
    (tag, idx, arr) => arr.indexOf(tag) !== idx,
  );

  return duplicates.length > 0;
}

/**
 * Check if a tag-related error should be cleared.
 */
export function isTagRelatedError(error: string | undefined): boolean {
  if (!error) return false;
  return (
    error === 'Duplicate tag detected' ||
    error.includes('Tag already exists') ||
    error.includes('Invalid tag format') ||
    error.includes('Release already exists')
  );
}
