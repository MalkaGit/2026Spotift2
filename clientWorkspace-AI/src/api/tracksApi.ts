import { httpClient } from './httpClient';

/**
 * Record a play event for a track (analytics v3).
 * POST /analytics/v3/tracks/:trackId/play
 */
export async function recordTrackPlay(trackId: string): Promise<void> {
  await httpClient.post(`/analytics/v3/tracks/${trackId}/play`);
}
