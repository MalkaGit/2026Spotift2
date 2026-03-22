import { z } from "zod";
import {
  WHATS_NEW_OBJECT_TYPES,
  type WhatsNewObjectType,
} from "./query.whats-new.input";

export const QueryWhatsNewInputSchema = z
  .object({
    object_type: z
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
            WHATS_NEW_OBJECT_TYPES.includes(p as WhatsNewObjectType)
          );
        },
        {
          message: `object_type must be one of: ${WHATS_NEW_OBJECT_TYPES.join(
            ", "
          )}`,
        }
      )
      .transform((s): WhatsNewObjectType[] | undefined => {
        if (!s || !s.trim()) return undefined;
        const parts = s
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        return parts.length ? (parts as WhatsNewObjectType[]) : undefined;
      }),
    days: z.coerce.number().int().min(1).max(90).default(60),
    limit: z.coerce.number().int().min(1).max(150).default(10),
    cursor: z
      .string()
      .optional()
      .transform((c) => (c?.trim() ? c.trim() : undefined))
      .describe(
        "Optional. Opaque base64url JSON { releaseDate, releasedObjectId }. Omit or empty = first page."
      ),
  })
  .strict();
