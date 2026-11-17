/**
 * Show a saved date (deal deadline, request "needed by") as the day the person picked.
 *
 * These are stored as a moment in UTC (deals at 23:59:59Z on the chosen day, requests at
 * midnight UTC). Formatting in the viewer's own time zone moved them a day: Jan 15 showed
 * as Jan 16 in India and Jan 14 in the US. Formatting in UTC always shows the chosen day.
 */
export function formatDay(value, options = { dateStyle: "medium" }) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}
