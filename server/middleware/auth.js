import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    req.deviceId = decoded.deviceId;
    // Touch the device's lastActive marker so the Active Sessions list stays
    // current, and reject tokens whose device has been revoked.
    if (decoded.deviceId) {
      const device = req.user.devices?.id(decoded.deviceId);
      if (!device) {
        return res.status(401).json({ success: false, error: 'Session revoked' });
      }
      device.lastActive = new Date();
      await req.user.save();
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
};

export const generateToken = (userId, deviceId) => {
  return jwt.sign({ id: userId, deviceId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};