import fs from 'fs';

/**
 * Supported MIME and document types verified by binary magic numbers.
 */
export type AllowedFileType = 'pdf' | 'png' | 'jpeg';

/**
 * Result of magic number validation.
 */
export interface MagicValidationResult {
  valid: boolean;
  type?: AllowedFileType;
  mime?: string;
  error?: string;
}

/**
 * Validates a file's binary magic bytes on disk.
 * Explicitly rejects dangerous binaries (PE / Windows Executable 'MZ', Linux ELF, Mach-O).
 * Confirms legitimate PDF (%PDF), PNG (\x89PNG), and JPEG (\xFF\xD8\xFF) headers.
 *
 * @param filePath Absolute path to temporary disk file
 * @returns MagicValidationResult
 */
export function validateFileMagicBytes(filePath: string): MagicValidationResult {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(16);
  const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  if (bytesRead < 4) {
    return { valid: false, error: 'File is too small to determine binary type.' };
  }

  // 1. Detect and immediately block executable formats
  // Windows PE / MZ ('MZ' = 0x4D 0x5A)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, error: 'Blocked: Disguised Windows Executable (MZ header) detected.' };
  }
  // Linux ELF (0x7F 'ELF' = 0x7F 0x45 0x4C 0x46)
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { valid: false, error: 'Blocked: Disguised Linux ELF executable detected.' };
  }
  // Mach-O binaries (0xFE 0xED 0xFA 0xCE or 0xCF 0xFA 0xED 0xFE)
  if (
    (buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa && (buffer[3] === 0xce || buffer[3] === 0xcf)) ||
    (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe)
  ) {
    return { valid: false, error: 'Blocked: Disguised Mach-O executable detected.' };
  }

  // 2. Validate legitimate documents
  // PDF (%PDF = 0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, type: 'pdf', mime: 'application/pdf' };
  }

  // PNG (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, type: 'png', mime: 'image/png' };
  }

  // JPEG (0xFF 0xD8 0xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, type: 'jpeg', mime: 'image/jpeg' };
  }

  return { valid: false, error: 'Invalid document signature. Only genuine PDF, PNG, and JPEG files are supported.' };
}
