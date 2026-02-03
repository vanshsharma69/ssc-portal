const defaultFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export const formatDate = (value, { formatOptions, fallback = "N/A" } = {}) => {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const formatter = formatOptions
    ? new Intl.DateTimeFormat("en-US", formatOptions)
    : defaultFormatter;

  return formatter.format(date);
};
