import * as tus from 'tus-js-client';
import { initUploadSession } from './buildAPIService';
import { API_BASE_URL } from 'constants/config';
import store from 'store';
import type { AxiosError } from 'axios';

export interface UploadOptions {
  files: File[];
  scope: 'admin' | 'user';
  userId: string;
  tags?: Record<string, string>;
  onProgress?: (
    percent: number,
    meta: { fileIndex: number; fileName: string },
  ) => void;
  onStart?: (meta: { fileIndex: number; fileName: string }) => void;
  onComplete?: (meta: {
    fileIndex: number;
    fileName: string;
    uploadId: string;
  }) => void;
  onError?: (
    err: Error,
    meta: { fileIndex: number; fileName: string; message?: string },
  ) => void;
}

export const uploadFiles = async (opts: UploadOptions) => {
  const {
    files,
    scope,
    userId,
    tags,
    onProgress,
    onStart,
    onComplete,
    onError,
  } = opts;
  if (!files.length) return;

  // Initialize one upload session id for this batch
  const { uploadId } = await initUploadSession(files.length);

  // Get auth token from store
  const state = store.getState();
  const token = state.auth.token;
  const refreshToken = state.auth.refreshToken;

  // Determine endpoint based on scope
  const tusEndpoint = `${API_BASE_URL}/device/build/upload/tus`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name;
    const tag = tags?.[fileName] || '';

    // Debug logging
    console.log(`uploadService - Processing file ${i + 1}/${files.length}:`, {
      fileName,
      tag,
      scope,
      hasTags: !!tags,
      allTags: tags,
    });

    // Validate tag for user uploads (custom builds)
    if (scope === 'user' && (!tag || !tag.trim())) {
      onError?.(new Error('Tag is required for custom builds'), {
        fileIndex: i,
        fileName,
        message: 'Tag is required for custom builds',
      });
      continue; // Skip this file
    }

    onStart?.({ fileIndex: i, fileName });

    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          chunkSize: 5 * 1024 * 1024, // 5MB chunks for better resume capability
          metadata: {
            filename: fileName,
            filetype: file.type || 'application/octet-stream',
            uploadId,
            tag,
          },
          headers: {
            'x-user-id': userId,
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...(refreshToken ? { refreshtoken: `Bearer ${refreshToken}` } : {}),
          },
          onError: (error: Error | tus.DetailedError) => {
            reject(error);
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            const percent = Math.round((bytesUploaded * 100) / bytesTotal);
            onProgress?.(percent, { fileIndex: i, fileName });
          },
          onSuccess: () => {
            // Wait a bit for backend processing to complete
            // The backend emits websocket events, so if there's an error it will be caught
            setTimeout(() => {
              resolve();
            }, 500);
          },
        });

        // Start the upload
        upload.start();
      });

      onComplete?.({ fileIndex: i, fileName, uploadId });
    } catch (error) {
      const err = error as
        | AxiosError<{ message?: string }>
        | tus.DetailedError
        | Error;
      let message = 'Upload failed';

      if ('response' in err && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      onError?.(err as Error, { fileIndex: i, fileName, message });
      // Don't continue to next file if one fails
      throw err;
    }
  }
};
