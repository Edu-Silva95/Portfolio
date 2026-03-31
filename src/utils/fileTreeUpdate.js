export const resolveThisPcPath = (path) => {
  const p = String(path || "");
  if (!p) return "";
  return p.startsWith("This PC") ? p : `This PC > ${p}`;
};

export const updateFileTreeList = (prevTree, path, listKey, updater) => {
  if (!prevTree || typeof prevTree !== "object") return prevTree;
  if (!path) return prevTree;
  if (typeof updater !== "function") return prevTree;

  const entry = prevTree[path] ? { ...prevTree[path] } : { [listKey]: [] };
  const list = Array.isArray(entry[listKey]) ? [...entry[listKey]] : [];
  const nextList = updater(list);

  return {
    ...prevTree,
    [path]: {
      ...entry,
      [listKey]: Array.isArray(nextList) ? nextList : list,
    },
  };
};
