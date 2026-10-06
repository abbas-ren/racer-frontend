import { useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const allowedExtensions = [
  'txt',
  'log',
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'zip',
];

/**
 * Zod Schema
 */
const schema = z.object({
  deviceFamily: z.string().min(1, 'Device family is required'),
  device: z.string().min(1, 'Device is required'),
  buildVersion: z.string().min(1, 'Build version is required'),

  description: z
    .string()
    .min(10, 'Please provide at least 10 characters')
    .max(1000, 'Maximum 1000 characters allowed'),

  attachLogs: z.boolean(),

  file: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine(
      (file) => {
        if (!file) return true;

        if (file.size > MAX_SIZE_BYTES) return false;

        const ext = file.name.split('.').pop()?.toLowerCase();
        return !!ext && allowedExtensions.includes(ext);
      },
      {
        message:
          'Invalid file. Allowed: .txt, .log, .pdf, images, .zip (Max 10MB)',
      },
    ),
});

export type ReportIssueFormValues = z.infer<typeof schema>;

type UseReportIssueFormArgs = {
  defaults?: Partial<
    Pick<ReportIssueFormValues, 'deviceFamily' | 'device' | 'buildVersion'>
  >;
  onSubmit?: (data: ReportIssueFormValues) => void | Promise<void>;
};

/**
 * Hook
 */
export default function useReportIssueForm({
  defaults,
  onSubmit,
}: UseReportIssueFormArgs) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const defaultValues = useMemo<ReportIssueFormValues>(
    () => ({
      deviceFamily: defaults?.deviceFamily ?? '',
      device: defaults?.device ?? '',
      buildVersion: defaults?.buildVersion ?? '',
      description: '',
      attachLogs: true,
      file: null,
    }),
    [defaults?.deviceFamily, defaults?.device, defaults?.buildVersion],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ReportIssueFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  const description = watch('description');
  const descriptionLength = description?.length ?? 0;

  const selectedFile = watch('file');
  const watchedDeviceFamily = watch('deviceFamily');
  const watchedDevice = watch('device');

  const triggerFileDialog = () => {
    inputRef.current?.click();
  };

  const onFileChange = (file: File | null) => {
    setValue('file', file, { shouldValidate: true });
  };

  const submit = handleSubmit(async (data) => {
    await onSubmit?.(data);
  });

  const resetToEmpty = () =>
    reset({
      deviceFamily: '',
      device: '',
      buildVersion: '',
      description: '',
      attachLogs: true,
      file: null,
    });

  return {
    control,
    register,
    errors,
    isSubmitting,
    descriptionLength,
    selectedFile,
    inputRef,
    triggerFileDialog,
    onFileChange,
    submit,
    resetToEmpty,
    setValue,
    watchedDeviceFamily,
    watchedDevice,
  };
}
