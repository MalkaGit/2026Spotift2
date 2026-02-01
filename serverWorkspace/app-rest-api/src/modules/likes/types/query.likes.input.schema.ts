import { z } from 'zod';

export const QueryLikesInputSchema = z.object({
    sort: z.enum(['created_at', 'name']).default('created_at'),
    direction: z.enum(['asc','desc']).default('desc'),
    offset: z.coerce.number().nonnegative().default(0),
    limit: z.coerce.number().positive().default(20),
  });
