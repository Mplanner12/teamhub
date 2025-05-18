import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export const roleGuard = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!allowedRoles.includes(userRole)) {
      res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
      return;
    }
    next();
  };
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!roles.includes(req.user?.role || "")) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    next();
  };
};
