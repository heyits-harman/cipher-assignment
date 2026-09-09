// import type { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// interface AuthenticatedRequest extends Request {
//   user: {
//     id: string;
//     role: string;
//   };
// }

// const authValidation = (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization || req.headers.Authorization;

//   if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
//     const token = authHeader.split(' ')[1];
//     const secret = process.env.ACCESS_TOKEN || '';

//     jwt.verify(token!, secret, (err, decoded: any) => {
//       if (err || !decoded) {
//         return res.status(401).json({ error: 'User not Authorized!' });
//       }

//       req.user = {
//           id: decoded.id,
//           role: decoded.role
//       };
//       next();
//     });
//   } else {
//     res.status(401).json({ error: 'Token not provided or token format invalid!' });
//   }
// };

// export default authValidation;