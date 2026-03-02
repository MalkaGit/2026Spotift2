/**
 * Artist model matching the artists table schema.
 * Table: artists (id, user_id, name, bio, image_url, header_image_url, action_bar_image_url, created_at)
 * FK: user_id → users(id) ON DELETE CASCADE
 */
export interface Artist {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  headerImageUrl: string | null;
  actionBarImageUrl: string | null;
  createdAt: string;
}
