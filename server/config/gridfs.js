import { Readable } from 'stream';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const BUCKET = 'uploads';

const bucketFor = () => {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
};

export const storeFile = async ({ name, type, size, data }) => {
  const bucket = bucketFor();
  const id = new ObjectId();
  await new Promise((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, name, {
      contentType: type,
      metadata: { size },
    });
    Readable.from(data).pipe(stream)
      .on('error', reject)
      .on('finish', resolve);
  });
  return id.toString();
};

export const serveFile = async (req, res, fileId, fallback) => {
  let id;
  try {
    id = new ObjectId(fileId);
  } catch {
    if (fallback) return fallback(req, res);
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  try {
    const bucket = bucketFor();
    const files = await bucket.find({ _id: id }).limit(1).toArray();
    if (!files.length) throw new Error('not found');
    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    bucket.openDownloadStream(id).on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, error: 'Not found' });
    }).pipe(res);
  } catch {
    if (fallback) return fallback(req, res);
    return res.status(404).json({ success: false, error: 'Not found' });
  }
};
