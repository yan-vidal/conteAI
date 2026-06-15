import type { DateLike } from "@conteai/shared";

const twoDigits = (value: number): string =>
  value < 10 ? `0${value}` : String(value);

// Ports the legacy `getDateHour` (yan-site-front-vue/src/utils/date.js):
// manual DD/MM/YY HH:MM formatting in local time, matching the modal chrome.
export const getDateHour = (date: DateLike | undefined): string => {
  if (date === undefined) {
    return "";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return `${twoDigits(value.getDate())}/${twoDigits(value.getMonth() + 1)}/${value
    .getFullYear()
    .toString()
    .slice(2)} ${twoDigits(value.getHours())}:${twoDigits(value.getMinutes())}`;
};
