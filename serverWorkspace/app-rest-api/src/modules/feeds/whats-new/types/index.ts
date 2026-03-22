/**
 * What's New feed — query types, validation, and response shape (e.g. GET /me/feeds/whats-new).
 */
export {
  WHATS_NEW_OBJECT_TYPES,
  type WhatsNewObjectType,
  type QueryWhatsNewInput,
} from "./query.whats-new.input";
export { QueryWhatsNewInputSchema } from "./query.whats-new.input.schema";
export {
  type WhatsNewOutput,
  type WhatsNewItem,
  type WhatsNewActor,
  type WhatsNewObject,
} from "./query.whats-new.output";
