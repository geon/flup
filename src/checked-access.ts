export function checkedAccess<Record, Key extends keyof Record>(record: Record | undefined, key: Key | undefined): Exclude<Record[Key], undefined> {
  if (!record) {
    throw new Error(`Missing record.`);
  }

  if (key === undefined) {
    throw new Error(`Missing key.`);
  }

  const value = record[key];
  if (value === undefined) {
    throw new Error(`Missing value for key ${key.toString()}`);
  }

  // https://www.reddit.com/r/typescript/comments/18ya5sv/type_narrowing_and_t_null/
  // Casting because the actual type `Record[Key] & ({} | null)` is confusing.
  return value as ReturnType<typeof checkedAccess>;
}
