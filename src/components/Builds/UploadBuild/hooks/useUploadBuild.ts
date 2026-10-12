import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { checkReleaseExists } from 'services/buildAPIService';
import {
  validateFiles,
  validateFilenameFormat,
  parseBuildFilename,
  findDuplicateTags,
  isTagRelatedError,
} from '../helpers';

interface UseUploadBuildParams {
  maxFiles: number;
  buildType: 'official' | 'custom';
}

/**
 * Custom hook that encapsulates all UploadBuild state management:
 * file list, tags, validation, error tracking, and debounced API checks.
 */
export default function useUploadBuild({
  maxFiles,
  buildType,
}: UseUploadBuildParams) {
  const fileKeyMapRef = useRef<WeakMap<File, string>>(new WeakMap());
  const fileKeyCounterRef = useRef(0);
  const getFileKey = useCallback((file: File) => {
    const existing = fileKeyMapRef.current.get(file);
    if (existing) {
      return existing;
    }
    fileKeyCounterRef.current += 1;
    const key = `${file.name}__${file.size}__${file.lastModified}__${fileKeyCounterRef.current}`;
    fileKeyMapRef.current.set(file, key);
    return key;
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [tagValidationInProgress, setTagValidationInProgress] = useState<
    Record<string, boolean>
  >({});
  const tagValidationTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const totalSize = useMemo(() => {
    const total = files.reduce((acc, f) => acc + (f.size || 0), 0);
    return total / (1024 * 1024);
  }, [files]);

  const isUploadDisabled =
    Object.keys(fileErrors).length > 0 ||
    Object.values(tagValidationInProgress).some((v) => v) ||
    (buildType === 'custom' &&
      files.length > 0 &&
      files.some((f) => !tags[getFileKey(f)] || !tags[getFileKey(f)].trim()));

  const handlePickFiles = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(evt.target.files || []);
      const combined = [...files, ...list];

      if (combined.length > maxFiles) {
        setFiles(combined.slice(0, maxFiles));
      } else {
        setFileErrors({});

        const { errors } = validateFiles(combined, getFileKey);
        setFiles(combined);
        setFileErrors(errors);

        if (buildType === 'official') {
          void Promise.all(
            combined.map(async (f) => {
              const fileKey = getFileKey(f);
              const parsed = parseBuildFilename(f.name);
              if (!parsed) {
                setFileErrors((prev) => ({
                  ...prev,
                  [fileKey]:
                    'Invalid filename. Expected [device_type]__version.zip',
                }));
                return;
              }

              const exists = await checkReleaseExists(
                parsed.deviceType,
                parsed.version,
              );
              if (exists) {
                setFileErrors((prev) => ({
                  ...prev,
                  [fileKey]: `Release already exists for ${parsed.deviceType} ${parsed.version}`,
                }));
              }
            }),
          );
        } else {
          combined.forEach((f) => {
            const fileKey = getFileKey(f);
            const formatError = validateFilenameFormat(f.name);
            if (formatError) {
              setFileErrors((prev) => ({
                ...prev,
                [fileKey]: formatError,
              }));
            }
          });
        }
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [buildType, files, getFileKey, maxFiles],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const f = files[index];
      const next = files.filter((_, i) => i !== index);
      setFiles(next);

      if (f) {
        const fileKey = getFileKey(f);
        const nextErrors = { ...fileErrors };
        delete nextErrors[fileKey];
        setFileErrors(nextErrors);

        const nextTagValidation = { ...tagValidationInProgress };
        delete nextTagValidation[fileKey];
        setTagValidationInProgress(nextTagValidation);

        const timer = tagValidationTimers.current[fileKey];
        if (timer) {
          clearTimeout(timer);
          delete tagValidationTimers.current[fileKey];
        }

        if (buildType === 'custom') {
          const nextTags = { ...tags };
          delete nextTags[fileKey];
          setTags(nextTags);
        }
      }
    },
    [buildType, files, fileErrors, getFileKey, tagValidationInProgress, tags],
  );

  const handleTagChange = useCallback(
    (fileKey: string, fileName: string, value: string) => {
      setTags((prev) => ({ ...prev, [fileKey]: value }));

      if (tagValidationTimers.current[fileKey]) {
        clearTimeout(tagValidationTimers.current[fileKey]);
      }

      if (!value.trim()) {
        setFileErrors((prev) => {
          const next = { ...prev };
          if (isTagRelatedError(next[fileKey])) {
            delete next[fileKey];
          }
          return next;
        });
        setTagValidationInProgress((prev) => ({
          ...prev,
          [fileKey]: false,
        }));
        return;
      }

      if (findDuplicateTags(tags, fileKey, value)) {
        setFileErrors((prev) => ({
          ...prev,
          [fileKey]: 'Duplicate tag detected',
        }));
        setTagValidationInProgress((prev) => ({
          ...prev,
          [fileKey]: false,
        }));
        return;
      }

      setTagValidationInProgress((prev) => ({ ...prev, [fileKey]: true }));
      tagValidationTimers.current[fileKey] = setTimeout(async () => {
        try {
          const parsed = parseBuildFilename(fileName);

          if (parsed) {
            const versionWithTag = `${parsed.version}-${value.trim()}`;
            const exists = await checkReleaseExists(
              parsed.deviceType,
              versionWithTag,
            );

            if (exists) {
              setFileErrors((prev) => ({
                ...prev,
                [fileKey]: `Release already exists for ${parsed.deviceType} ${versionWithTag}`,
              }));
            } else {
              setFileErrors((prev) => {
                const next = { ...prev };
                if (isTagRelatedError(next[fileKey])) {
                  delete next[fileKey];
                }
                return next;
              });
            }
          } else {
            setFileErrors((prev) => {
              const next = { ...prev };
              if (isTagRelatedError(next[fileKey])) {
                delete next[fileKey];
              }
              return next;
            });
          }
        } catch (err) {
          console.error('Tag validation error:', err);
        } finally {
          setTagValidationInProgress((prev) => ({
            ...prev,
            [fileKey]: false,
          }));
        }
      }, 500);
    },
    [tags],
  );

  useEffect(() => {
    if (files.length === 0) return;

    const { errors } = validateFiles(files, getFileKey);
    if (buildType === 'custom') {
      files.forEach((file) => {
        const formatError = validateFilenameFormat(file.name);
        if (formatError) errors[getFileKey(file)] = formatError;
      });
      setFileErrors(errors);
      return;
    }

    let cancelled = false;
    void Promise.all(
      files.map(async (file) => {
        const parsed = parseBuildFilename(file.name);
        if (!parsed) {
          errors[getFileKey(file)] =
            'Invalid filename. Expected [device_type]__version.zip';
          return;
        }
        if (await checkReleaseExists(parsed.deviceType, parsed.version)) {
          errors[getFileKey(file)] =
            `Release already exists for ${parsed.deviceType} ${parsed.version}`;
        }
      }),
    ).finally(() => {
      if (!cancelled) setFileErrors(errors);
    });

    return () => {
      cancelled = true;
    };
  }, [buildType, files, getFileKey]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = tagValidationTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    inputRef,
    files,
    tags,
    getFileKey,
    fileErrors,
    tagValidationInProgress,
    totalSize,
    isUploadDisabled,
    handlePickFiles,
    handleRemove,
    handleTagChange,
  };
}
