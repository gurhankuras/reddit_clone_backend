export default function makeSetUpdate(body : Object, prefix?: String) : Record<string, Boolean> {
    const entries = Object.entries(body);
    const setKeyPrefix = prefix || '';

  const setObj = {};
  entries.forEach((entry) => {
    const key = entry[0];
    const val = entry[1];
    // @ts-ignore
    setObj[`${setKeyPrefix}.${key}`] = val;
  });
    return setObj
}