import { useEffect, useRef } from 'react';
import { getSharedSocket } from 'services/socketIoClient';
import type { Socket } from 'socket.io-client';

interface UploadEvent {
  type:
    | 'upload_progress'
    | 'upload_complete'
    | 'upload_error'
    | 'build_uploaded'
    | 'build_status_changed'
    | 'build_flagged'
    | 'build_deleted';
  data?: {
    percent?: number;
    uploadId?: string;
    fileName?: string;
    message?: string;
    releaseId?: string;
    version?: string;
    deviceType?: string;
    deviceFamily?: string;
    buildType?: string;
    status?: string;
    isFaulty?: boolean;
    userId?: string;
  };
}

interface UseUploadWebSocketOptions {
  userId: string;
  enabled: boolean;
  selectedDeviceType?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: (data: { uploadId?: string; fileName?: string }) => void;
  onError?: (message: string) => void;
  onBuildUploaded?: (data: {
    releaseId?: string;
    version?: string;
    deviceType?: string;
    deviceFamily?: string;
    buildType?: string;
  }) => void;
  onBuildFlagged?: (data: {
    releaseId?: string;
    isFaulty?: boolean;
    version?: string;
    deviceType?: string;
    userId?: string;
  }) => void;
  onBuildStatusChanged?: (data: {
    releaseId?: string;
    status?: string;
    isFaulty?: boolean;
    version?: string;
    deviceType?: string;
    userId?: string;
  }) => void;
  onBuildDeleted?: (data: {
    releaseId?: string;
    version?: string;
    deviceType?: string;
    userId?: string;
  }) => void;
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

    const onUploadProgress = (data: UploadEvent['data']) => {
      const percent = Number(data?.percent ?? 0);
      cbRefs.current.onProgress?.(percent);
    };

    const onUploadComplete = (data: UploadEvent['data']) => {
      cbRefs.current.onComplete?.({
        uploadId: data?.uploadId,
        fileName: data?.fileName,
      });
    };

    const onUploadError = (data: UploadEvent['data']) => {
      cbRefs.current.onError?.(data?.message || 'Upload failed');
    };

    const onBuildUploadedEvent = (data: UploadEvent['data']) => {
      const buildData = {
        releaseId: data?.releaseId,
        version: data?.version,
        deviceType: data?.deviceType,
        deviceFamily: data?.deviceFamily,
        buildType: data?.buildType,
      };
      cbRefs.current.onBuildUploaded?.(buildData);

      if (
        cbRefs.current.selectedDeviceType &&
        data?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildStatusChangedEvent = (data: UploadEvent['data']) => {
      const statusData = {
        releaseId: data?.releaseId,
        status: data?.status,
        isFaulty: data?.isFaulty,
        version: data?.version,
        deviceType: data?.deviceType,
        userId: data?.userId,
      };
      cbRefs.current.onBuildStatusChanged?.(statusData);

      if (
        cbRefs.current.selectedDeviceType &&
        data?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildFlaggedEvent = (data: UploadEvent['data']) => {
      const flagData = {
        releaseId: data?.releaseId,
        isFaulty: data?.isFaulty,
        version: data?.version,
        deviceType: data?.deviceType,
        userId: data?.userId,
      };
      cbRefs.current.onBuildFlagged?.(flagData);

      if (
        cbRefs.current.selectedDeviceType &&
        data?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    const onBuildDeletedEvent = (data: UploadEvent['data']) => {
      const deleteData = {
        releaseId: data?.releaseId,
        version: data?.version,
        deviceType: data?.deviceType,
        userId: data?.userId,
      };
      cbRefs.current.onBuildDeleted?.(deleteData);

      if (
        cbRefs.current.selectedDeviceType &&
        data?.deviceType === cbRefs.current.selectedDeviceType &&
        cbRefs.current.onRefetchBuilds
      ) {
        cbRefs.current.onRefetchBuilds();
      }
    };

    ws.on('upload_progress', onUploadProgress);
    ws.on('upload_complete', onUploadComplete);
    ws.on('upload_error', onUploadError);
    ws.on('build_uploaded', onBuildUploadedEvent);
    ws.on('build_status_changed', onBuildStatusChangedEvent);
    ws.on('build_flagged', onBuildFlaggedEvent);
    ws.on('build_deleted', onBuildDeletedEvent);

    return () => {
      ws.off('upload_progress', onUploadProgress);
      ws.off('upload_complete', onUploadComplete);
      ws.off('upload_error', onUploadError);
      ws.off('build_uploaded', onBuildUploadedEvent);
      ws.off('build_status_changed', onBuildStatusChangedEvent);
      ws.off('build_flagged', onBuildFlaggedEvent);
      ws.off('build_deleted', onBuildDeletedEvent);
      wsRef.current = null;
    };
  }, [enabled, userId]);

  return wsRef;
};
