import { Request, Response, NextFunction } from "express";
import { authService } from "../service";
import { RegisterDto, LoginDto, RefreshDto } from "../dto";

export async function register(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await authService.register(RegisterDto.parse(req.body))); }
  catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try { res.json(await authService.login(LoginDto.parse(req.body))); }
  catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try { res.json(await authService.refresh(RefreshDto.parse(req.body).refreshToken)); }
  catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try { res.json(await authService.me(req.user!.userId)); }
  catch (err) { next(err); }
}
