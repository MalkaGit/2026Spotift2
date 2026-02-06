import { httpClient } from './httpClient';
import type { LikesItem, QueryLikesParams, AddLikeInput } from '@/types';

export interface LikesResponse {
  items: LikesItem[];
}

/** Pick first truthy value from possible image URL keys (backend/MySQL may use different casings). */
function pickImageUrl(raw: Record<string, unknown>): string | undefined {
  const keys = ['likedEntityImageUrl', 'liked_entity_image_url', 'likedentityimageurl'];
  for (const k of keys) {
    const v = raw[k];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  const imageKey = Object.keys(raw).find((k) => /image/i.test(k));
  if (imageKey) {
    const v = raw[imageKey];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return undefined;
}

/** Normalize a raw API item to LikesItem (handles snake_case or lowercase keys from backend/MySQL). */
function normalizeLikesItem(raw: Record<string, unknown>): LikesItem {
  const imageUrl = pickImageUrl(raw);
  return {
    id: String(raw.id ?? ''),
    likedEntityType: (raw.likedEntityType ?? raw.liked_entity_type ?? raw.likedentitytype ?? 'artist') as LikesItem['likedEntityType'],
    likedEntityId: String(raw.likedEntityId ?? raw.liked_entity_id ?? raw.likedentityid ?? ''),
    likedEntityName: String(raw.likedEntityName ?? raw.liked_entity_name ?? raw.likedentityname ?? ''),
    likedEntityImageUrl: imageUrl != null && imageUrl !== '' ? String(imageUrl) : undefined,
    createdAt: raw.createdAt != null
      ? String(raw.createdAt)
      : raw.created_at != null
        ? (raw.created_at instanceof Date ? raw.created_at.toISOString() : String(raw.created_at))
        : (raw.createdat != null ? String(raw.createdat) : new Date().toISOString()),
  };
}

export async function getMyLikes(params?: QueryLikesParams, signal?: AbortSignal): Promise<LikesResponse> {
  const { data } = await httpClient.get<{ items: unknown[] }>('/users/me/likes', {
    params: { ...params, _: Date.now() },
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    signal,
  });
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  return {
    items: rawItems.map((raw) => normalizeLikesItem(typeof raw === 'object' && raw != null ? (raw as Record<string, unknown>) : {})),
  };
}

export async function addLike(input: AddLikeInput): Promise<void> {
  await httpClient.post('/users/me/likes', input);
}
