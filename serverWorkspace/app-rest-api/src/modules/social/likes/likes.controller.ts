import * as likesService from "./likes.service";

import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import { Response, NextFunction } from "express";

import { AddLikeInput, AddLikeOutput } from "./types";
import { QueryLikesInput, LikesItem } from "./types";

/*
** POST /users/me/likes (from users router)
 * Adds a like for the authenticated user.
 * 
 * @requires Authentication - JWT token required
 */
export async function addLike(
  req: TypedRequest<AddLikeInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;                     // userId is guaranteed to be non-null because authentication middleware throws if unauthenticated
    const input: AddLikeInput = req.body;                                   // No 'as' needed - req.body is already typed as AddLikeInput
    const output: AddLikeOutput = await likesService.addLike(userId, input);
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/me/likes   (from users router)
 * Returns the authenticated user's likes with pagination and sorting.
 * 
 * @requires Authentication - JWT token required (app-level middleware)
 * @query QueryLikesInput - Pagination and sorting parameters (validated by middleware)
 * @returns {items: LikesItem[]} - Array of liked items, simple response with items array, no need to wrap in output object
 */
export async function queryMyLikes(
  req: TypedRequest<any, any, QueryLikesInput>,
  res: Response,
  next: NextFunction
) {
  try {
    
    const userId: string = requestContext.getUserId()!;                              // userId is guaranteed to be non-null because authentication middleware throws if unauthenticated
    const query: QueryLikesInput = req.validatedQuery!;                              // No 'as' needed -Validation middleware ensures req.validatedQuery is typed as QueryLikesInput (matching QueryLikesInputSchema)

    const items: LikesItem[] = await likesService.queryLikesByUser(userId, query);
    res.status(200).json({ items });                                                 // Just structure response with items array, no need to wrap in output object
  } catch (err) {
    next(err);
  }
}

