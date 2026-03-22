import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as whatsNewService from "./whats-new.service";
import type { QueryWhatsNewInput } from "../types";

/**
 * GET /me/feeds/whats-new/v1
 */
export async function getWhatsNewFeeds(
  req: TypedRequest<unknown, unknown, QueryWhatsNewInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = requestContext.getUserId()!;
    const query = req.validatedQuery!;
    const output = await whatsNewService.getWhatsNewFeeds(userId, query);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
}
