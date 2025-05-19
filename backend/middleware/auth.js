import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    
    // Debug log
    console.log(`Authenticated user: ${req.user.id}, role: ${req.user.role}`);
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    console.log(`Authorization check: User role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
    
    if (!roles.includes(req.user.role)) {
      console.error(`Authorization failed: User role ${req.user.role} not in allowed roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    console.log('Authorization successful');
    next();
  };
};