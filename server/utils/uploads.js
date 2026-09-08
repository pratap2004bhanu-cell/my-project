import fs from 'fs';

// Magic-byte validation for common image formats so files can't masquerade as
// images based on a spoofed multipart Content-Type (stored-XSS surface).
export const isImageBuffer = (buf) => {
  if (!buf || buf.length < 4) return false;
  // JPEG: FFD8FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF87a / GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WEBP: RIFF....WEBP (bytes 0-3 = RIFF, 8-11 = WEBP)
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return true;
  return false;
};

// multer fileFilter for image-only upload routes (mimetype gate).
export const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

// Validate a disk-backended upload by re-reading its magic bytes; invalid files
// are deleted and dropped from the result so routes never persist fake images.
export const isImageFile = (file) => {
  if (!file?.path) return false;
  try {
    return isImageBuffer(fs.readFileSync(file.path));
  } catch {
    return false;
  }
};

export const filterValidImages = (files = []) => {
  const valid = [];
  for (const f of files) {
    if (isImageFile(f)) {
      valid.push(f);
    } else {
      try {
        fs.unlinkSync(f.path);
      } catch { /* ignore */ }
    }
  }
  return valid;
};

// Chat attachments allowlist (excludes HTML/SVG/etc. that could execute inline).
export const CHAT_ALLOW = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'video/mp4', 'video/webm', 'video/ogg',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const chatFileFilter = (req, file, cb) => {
  if (!CHAT_ALLOW.includes(file.mimetype)) return cb(new Error('This file type cannot be shared'));
  cb(null, true);
};