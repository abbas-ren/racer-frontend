import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UploadProgressState {
  progress: number;
  filesTotal?: number;
  filesInProgress?: number;
  filesCompleted?: number;
  message?: string;
  status?: 'uploading' | 'completed' | 'error';
}

interface UploadState {
  progressUI: UploadProgressState | null;
}

const initialState: UploadState = {
  progressUI: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadProgress(
      state,
      action: PayloadAction<UploadProgressState | null>,
    ) {
      state.progressUI = action.payload;
    },
    resetUploadState: () => initialState,
  },
});

export const { setUploadProgress, resetUploadState } = uploadSlice.actions;

export default uploadSlice.reducer;
