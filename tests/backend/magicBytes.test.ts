import { describe, it, expect } from 'vitest';
import { validateFileMagicBytes } from '../../server/utils/magicBytes';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Binary Magic Bytes Validator Security Test', () => {
  it('should reject disguised Windows PE Executables (MZ header)', () => {
    const tmpFile = path.join(os.tmpdir(), `test_pe_${Date.now()}.exe`);
    fs.writeFileSync(tmpFile, Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]));

    try {
      const result = validateFileMagicBytes(tmpFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Blocked: Disguised Windows Executable');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it('should reject Linux ELF executables', () => {
    const tmpFile = path.join(os.tmpdir(), `test_elf_${Date.now()}.elf`);
    fs.writeFileSync(tmpFile, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]));

    try {
      const result = validateFileMagicBytes(tmpFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Blocked: Disguised Linux ELF executable');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it('should validate genuine PDF binary signatures (%PDF)', () => {
    const tmpFile = path.join(os.tmpdir(), `test_pdf_${Date.now()}.pdf`);
    fs.writeFileSync(tmpFile, Buffer.from('%PDF-1.7 header content here'));

    try {
      const result = validateFileMagicBytes(tmpFile);
      expect(result.valid).toBe(true);
      expect(result.type).toBe('pdf');
      expect(result.mime).toBe('application/pdf');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it('should validate genuine PNG binary signatures', () => {
    const tmpFile = path.join(os.tmpdir(), `test_png_${Date.now()}.png`);
    fs.writeFileSync(tmpFile, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    try {
      const result = validateFileMagicBytes(tmpFile);
      expect(result.valid).toBe(true);
      expect(result.type).toBe('png');
      expect(result.mime).toBe('image/png');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
