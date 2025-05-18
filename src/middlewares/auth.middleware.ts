import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UserModel } from "../modules/user/user.model";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: any;
}

export const authenticate = async (
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({ message: "User not found." });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired." });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res
        .status(401)
        .json({ message: "Invalid token signature or structure." });
    } else {
      res.status(400).json({ message: "Invalid token." });
    }
    return;
  }
};
