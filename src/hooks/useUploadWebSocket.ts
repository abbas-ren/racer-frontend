import { WSPayloadKind } from 'constants/websocket';
import { useEffect, useRef } from 'react';
import { getSharedSocket } from 'services/socketIoClient';
import type { Socket } from 'socket.io-client';
import { BuildStatusChangedPayload, BuildUploadedPayload, BuildFlaggedPayload, BuildDeletedPayload, UploadCompletePayload, UploadErrorPayload, UploadProgressPayload } from 'types/websocket';
interface UseUploadWebSocketOptions {
  userId: string;
  enabled: boolean;
  selectedDeviceType?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: (payload: { uploadId?: string; fileName?: string }) => void;
  onError?: (message: string) => void;
  onBuildUploaded?: (payload: BuildUploadedPayload) => void;
  onBuildFlagged?: (payload: BuildFlaggedPayload) => void;
  onBuildStatusChanged?: (payload: BuildStatusChangedPayload) => void;
  onBuildDeleted?: (payload: BuildDeletedPayload) => void;
  onRefetchBuilds?: () => void;
}

export const useUploadWebSocket = ({
  userId,
  enabled,
  selectedDeviceType,
  onProgress,
  onComplete,
  onError,
  onBuildUploaded,
  onBuildStatusChanged,
  onBuildFlagged,
  onBuildDeleted,
  onRefetchBuilds,
}: UseUploadWebSocketOptions) => {
  const wsRef = useRef<Socket | null>(null);

  // Store callbacks in refs so the effect doesn't depend on callback identity.
  // This prevents listener teardown/re-registration on every render.
  const cbRefs = useRef({
    onProgress,
    onComplete,
    onError,
    onBuildUploaded,
    onBuildStatusChanged,
    onBuildFlagged,
    onBuildDeleted,
    onRefetchBuilds,
    selectedDeviceType,
  });
  cbRefs.current = {
    onProgress,
    onComplete,
    onError,
    onBuildUploaded,
    onBuildStatusChanged,
    onBuildFlagged,
    onBuildDeleted,
    onRefetchBuilds,
    selectedDeviceType,
  };

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const ws = getSharedSocket(userId);
    wsRef.current = ws;

    const onUploadProgress = (payload: UploadProgressPayload) => {
      console.log('Upload progress data:', payload);
      const percent = Number(payload?.percent ?? 0);
      cbRefs.current.onProgress?.(percent);
    };

    const onUploadComplete = (payload: UploadCompletePayload) => {
      console.log('Upload complete data:', payload);
      cbRefs.current.onComplete?.({
        uploadId: payload?.uploadId,
        fileName: payload?.fileName,
      });
    };

    const onUploadError = (payload: UploadErrorPayload) => {
      console.log('Upload error data:', payload);
      cbRefs.current.onError?.(payload?.message || 'Upload failed');
    };

    const onBuildUploadedEvent = (payload: BuildUploadedPayload) => {
      console.log('Build uploaded data:', payload);
      cbRefs.current.onBuildUploaded?.(payload);

      if (
        cbRefs.current.selectedDeviceType &&
        payload?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildStatusChangedEvent = (payload: BuildStatusChangedPayload) => {
      console.log('Build status changed data:', payload);
      cbRefs.current.onBuildStatusChanged?.(payload);

      if (
        cbRefs.current.selectedDeviceType &&
        payload?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildFlaggedEvent = (payload: BuildFlaggedPayload) => {
      console.log('Build flagged data:', payload);
      cbRefs.current.onBuildFlagged?.(payload);

      if (
        cbRefs.current.selectedDeviceType &&
        payload?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildDeletedEvent = (payload: BuildDeletedPayload) => {
      console.log('Build deleted data:', payload);
      cbRefs.current.onBuildDeleted?.(payload);

      if (
        cbRefs.current.selectedDeviceType &&
        payload?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    ws.on(WSPayloadKind.uploadProgress, onUploadProgress);
    ws.on(WSPayloadKind.uploadComplete, onUploadComplete);
    ws.on(WSPayloadKind.uploadError, onUploadError);
    ws.on(WSPayloadKind.buildUploaded, onBuildUploadedEvent);
    ws.on(WSPayloadKind.buildStatusChanged, onBuildStatusChangedEvent);
    ws.on(WSPayloadKind.buildFlagged, onBuildFlaggedEvent);
    ws.on(WSPayloadKind.buildDeleted, onBuildDeletedEvent);

    return () => {
      ws.off(WSPayloadKind.uploadProgress, onUploadProgress);
      ws.off(WSPayloadKind.uploadComplete, onUploadComplete);
      ws.off(WSPayloadKind.uploadError, onUploadError);
      ws.off(WSPayloadKind.buildUploaded, onBuildUploadedEvent);
      ws.off(WSPayloadKind.buildStatusChanged, onBuildStatusChangedEvent);
      ws.off(WSPayloadKind.buildFlagged, onBuildFlaggedEvent);
      ws.off(WSPayloadKind.buildDeleted, onBuildDeletedEvent);
      wsRef.current = null;
    };
  }, [enabled, userId]);

  return wsRef;
};
