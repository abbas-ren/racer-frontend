import { Box, Stack, Dialog, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { toastService } from 'services/ToastService';
import styles from './UploadBuild.module.scss';
import { useUploadBuild } from './hooks';
import UploadHeader from './UploadHeader';
import UploadDropZone from './UploadDropZone';
import FileRow from './FileRow';
import UploadFooter from './UploadFooter';

export interface UploadBuildProps {
  open: boolean;
  userType?: 'user' | 'admin';
  maxFiles?: number;
  onCancel: () => void;
  onConfirm: (payload: {
    files: File[];
    tags?: Record<string, string>;
    adminTag?: string;
  }) => void;
}

function UploadBuild({
  open,
  userType = 'admin',
  maxFiles = 5,
  onCancel,
  onConfirm,
}: UploadBuildProps) {
  const theme = useTheme();
  const instructions: Array<{
    id: string;
    title: ReactNode;
    children?: ReactNode[];
  }> = [
    {
      id: 'required-files',
      title: 'The ZIP file must contain:',
      children: [
        'Required IPL files for Gen4 and Gen5',
        <>
          <code>rootfs.tar.bz2</code>
        </>,
        <>
          <code>Image</code>
        </>,
        <>
          <code>*.dtb</code> files
        </>,
      ],
    },
    {
      id: 'filename-format',
      title: 'ZIP filename format and examples:',
      children: [
        <>
          <code>&lt;deviceType&gt;_v&lt;version&gt;.zip</code> (e.g.{' '}
          <code>h3_v1.0.0.zip</code>, <code>x5h_v1.0.1.zip</code>)
        </>,
      ],
    },
    {
      id: 'version-rules',
      title: 'Version rules:',
      children: [
        'Version must always be unique.',
        'Do not reuse old version numbers, even if previous builds are deleted.',
        'Always increment/change the version to avoid conflicts.',
      ],
    },
    {
      id: 'zip-structure',
      title: 'ZIP structure rules:',
      children: [
        <>
          <code>Image</code>, <code>*.dtb</code>, and{' '}
          <code>rootfs.tar.bz2</code> must be placed in the root directory of
          the ZIP.
        </>,
        'Do not create additional folders inside the ZIP; keep files at the root level only.',
      ],
    },
  ];

  const {
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
  } = useUploadBuild({ maxFiles, userType });

  const handleUpload = () => {
    if (files.length === 0) {
      toastService.error('Please select at least one file to upload', {
        clearExisting: false,
        autoClose: 4000,
      });
      return;
    }

    const filenameTags =
      userType === 'user'
        ? files.reduce<Record<string, string>>((acc, file) => {
            const fileKey = getFileKey(file);
            const tag = tags[fileKey];
            if (tag !== undefined) {
              acc[file.name] = tag;
            }
            return acc;
          }, {})
        : undefined;

    onConfirm({
      files,
      tags: filenameTags,
    });
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={false}
      slotProps={{
        paper: {
          className: styles.modal,
        },
      }}
    >
      <Stack>
        <UploadHeader iconColor={theme.palette.blue[500]} />

        <Box className={styles.body}>
          <UploadDropZone
            fileCount={files.length}
            totalSize={totalSize}
            iconColor={theme.palette.grey[400]}
            inputRef={inputRef}
            onPickFiles={handlePickFiles}
          />

          <Box className={styles.instructionsCard}>
            <Typography variant="system1" className={styles.instructionsTitle}>
              Build Upload Instructions
            </Typography>

            <Box component="div" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {instructions.map((instruction) => (
                <Box key={instruction.id} sx={{ mb: 2 }}>
                  <Typography
                    variant="body3"
                    className={styles.instructionsText}
                    sx={{ fontWeight: 'bold !important' }} // Bold the main point title
                  >
                    {instruction.title}
                  </Typography>

                  {instruction.children?.length ? (
                    <Box
                      component="ol"
                      sx={{
                        mt: 0.5,
                        pl: 2.5,
                        fontSize: '11px !important',
                        '& li': { mb: 0.25 },
                      }}
                    >
                      {instruction.children.map((child, index) => (
                        <li key={index}>
                          <Typography
                            variant="body3"
                            className={styles.instructionsText}
                            sx={{
                              fontSize: '11px !important',
                              lineHeight: '1.4',
                            }}
                          >
                            {child}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Box>
          </Box>

          <Box className={styles.filesList}>
            {files.map((f, i) => {
              const fileKey = getFileKey(f);
              return (
                <FileRow
                  key={fileKey}
                  file={f}
                  fileKey={fileKey}
                  index={i}
                  userType={userType}
                  tagValue={tags[fileKey] || ''}
                  fileError={fileErrors[fileKey]}
                  isValidating={tagValidationInProgress[fileKey] || false}
                  removeIconColor={theme.palette.red[600]}
                  onRemove={handleRemove}
                  onTagChange={handleTagChange}
                />
              );
            })}
          </Box>
        </Box>

        <UploadFooter
          disabled={isUploadDisabled}
          onCancel={onCancel}
          onUpload={handleUpload}
        />
      </Stack>
    </Dialog>
  );
}

export default UploadBuild;
