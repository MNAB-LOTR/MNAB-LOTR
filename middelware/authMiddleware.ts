import { Request, Response, NextFunction } from "express";

const publicPaths = ["/","/login", "/register", "/logout"];

export function protectRoutes(req: Request, res: Response, next: NextFunction) {

  if (publicPaths.includes(req.path)) {
    return next();
  }

  if (req.session && req.session.userId) {
    return next();
  }

  return res.redirect("/login");
}
