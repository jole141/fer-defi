const TRIM_LENGTH = 20;

export const trimString = (str: string, length?: string) => {
  const len = length ? parseInt(length) : TRIM_LENGTH;
  if (str.length <= len) {
    return str;
  }
  const start = str.slice(0, len / 3);
  const end = str.slice(str.length - len / 3);
  return `${start}...${end}`;
};
