/** Real UUIDs so client-generated records map 1:1 onto Supabase primary keys with no remapping. */
export function generateId(): string {
  return crypto.randomUUID();
}
