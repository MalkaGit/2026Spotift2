import * as likesService from "./likes.service";

import { TypedRequest } from "@mycompanyname/lib-common";
import { Request, Response, NextFunction } from "express";

import { AddLikeInput, AddLikeOutput } from "./types";

/**
 * POST /users/me/likes (from ***users*** router)
 * Adds a like for the current user.
 */
export async function addLike(
  req: TypedRequest<AddLikeInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const input: AddLikeInput = req.body; // No 'as' needed - req.body is already typed as AddLikeInput
    const output: AddLikeOutput = await likesService.addLike(input);
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

