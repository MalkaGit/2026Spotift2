import { httpClient } from './httpClient';
import type { ReleaseFeedResponse, QueryReleaseFeedParams } from '@/types';

export type { ReleaseFeedItem, ReleaseFeedResponse, QueryReleaseFeedParams, ReleaseFeedEventType } from '@/types';

export async function getReleaseFeed(
  params?: QueryReleaseFeedParams,
  signal?: AbortSignal
): Promise<ReleaseFeedResponse> {
  const { event_type, days, limit, cursor } = params ?? {};
  const searchParams: Record<string, string> = {};
  if (event_type != null) {
    const types = Array.isArray(event_type) ? event_type : [event_type];
    searchParams.event_type = types.join(',');
  }
  if (days != null) searchParams.days = String(days);
  if (limit != null) searchParams.limit = String(limit);
  if (cursor != null && cursor.trim()) searchParams.cursor = cursor;

  const { data } = await httpClient.get<ReleaseFeedResponse>('/me/feeds/v3/releases', {
    params: searchParams,
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    signal,
  });

  return {
    items: data?.items ?? [],
    nextCursor: data?.nextCursor,
  };
}
