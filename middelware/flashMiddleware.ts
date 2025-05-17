import { FlashMessage } from "../types";
    
import { NextFunction, Request, Response } from "express";
declare module 'express-session'{
    interface SessionData{
        message: FlashMessage}
}
export function flashMiddleware
(req: Request, res: Response, next: NextFunction) {
    if (req.session.message) {
        res.locals.message = req.session.message;
        delete req.session.message;
    } else {
        res.locals.message = undefined;
    }
    next();
};