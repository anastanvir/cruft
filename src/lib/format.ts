import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / 1024 ** i;
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(date: Date | undefined): string {
  if (!date) {
    return "-";
  }
  return dayjs(date).fromNow();
}

export function formatDateFull(date: Date | undefined): string {
  if (!date) {
    return "-";
  }
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return `${str.slice(0, maxLen - 1)}…`;
}

export function formatName(name: string): string {
  return name.replace(/\.app$/i, "");
}
