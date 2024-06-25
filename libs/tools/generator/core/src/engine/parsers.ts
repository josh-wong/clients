export const SUBADDRESS_PARSER = new RegExp(
  "(?<username>[^@+]+)(?<subaddress>\\+.+)?(?<domain>@.+)",
);
