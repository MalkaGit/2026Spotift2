import { z } from "zod";
import {
  RELEASE_FEED_EVENT_TYPES,
  type ReleaseFeedEventType,
} from "./query.release.feed.input.model";

export const QueryReleaseFeedInputSchema = z
  .object({
    event_type: z
      .string()
      .optional()
      .refine(
        (s) => {
          if (!s || !s.trim()) return true;
          const parts = s
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          return parts.every((p) =>
            RELEASE_FEED_EVENT_TYPES.includes(p as ReleaseFeedEventType)
          );
        },
        {
          message: `event_type must be one of: ${RELEASE_FEED_EVENT_TYPES.join(
            ", "
          )}`,
        }
      )
      .transform((s): ReleaseFeedEventType[] | undefined => {
        if (!s || !s.trim()) return undefined;
        const parts = s
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        return parts.length ? (parts as ReleaseFeedEventType[]) : undefined;
      }),
    days: z.coerce.number().int().min(1).max(90).default(60),
    limit: z.coerce.number().int().min(1).max(150).default(10),
    cursor: z
      .string()
      .optional()
      .default("")
      .describe(
        "Opaque pagination cursor (base64url JSON { lastFeedId }); empty for first page"
      ),
  })
  .strict();

