export const has = <T extends Object, K extends string>(
  obj: T,
  key: K,
): obj is Extract<T, { [k in K]: any }> => key in obj;

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
