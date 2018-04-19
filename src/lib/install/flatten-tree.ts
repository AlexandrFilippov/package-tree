import moduleName from '../utils/module-name';

interface IFlat {
  [key: string]: IPhysicalTree;
}

interface INext {
  [key: number]: IPhysicalTree | string;
}

export function flattenTree(tree: IPhysicalTree): IFlat {
  const seen = new Set();
  const flat: IFlat = {};
  const todo: INext[] = [[tree, '/']];
  while (todo.length) {
    const next = todo.shift();

    if (!next) {
      continue;
    }

    const pkg = next[0] as IPhysicalTree;
    seen.add(pkg);
    let path = next[1] as string;
    flat[path] = pkg;

    if (path !== '/') {
      path += '/';
    }

    for (const dep of pkg.children) {
      const child = dep;
      if (!seen.has(child)) {
        todo.push([child, flatName(path, child)]);
      }
    }
  }

  return flat;
}

function flatName(path: string, child: IPhysicalTree): string {
  return path + (moduleName(child) || 'TOP');
}
