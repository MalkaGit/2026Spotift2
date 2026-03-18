import { z } from 'zod';
import { LIKED_ENTITY_TYPES } from "./likes.entity.type";

export const AddLikeInputSchema = z.object({
  entityType: z.enum(LIKED_ENTITY_TYPES),
  entityId: z.uuid(),
});