import * as path from 'path';

export const unloop = function(root: ITranslateTree): ITranslateTree {
  const queue = [root];
  const seen = new Set();
  seen.add(root);

  while (queue.length) {
    const current = queue.shift();
    if (current) {
      const deps = current.dependencies = current.dependencies || {};
      Object.keys(deps).forEach(function(d) {
        let dep = deps[d];

        if (dep.missing && !dep.dependencies) {
          return;
        }

        if (dep.path && seen.has(dep)) {
          dep = deps[d] = Object.assign({}, dep);
          dep.dependencies = {};
          dep._deduped = path.relative(root.path, dep.path)
            .replace(/node_modules\//g, '');
          return;
        }
        seen.add(dep);
        queue.push(dep);
      });
    }
  }

  return root;
};

export const filterByDepth = function(
  data: ITranslateTree,
  depth: number
): ITranslateTree {

  if (depth < 0) {
    delete data.dependencies;
    return data;
  }

  if (typeof data === 'object' && 'dependencies' in data) {
    for (const pkg in data.dependencies) {
      if (data.dependencies.hasOwnProperty(pkg)) {
        data.dependencies[pkg] = filterByDepth(
          data.dependencies[pkg],
          depth - 1
        );
      }
    }
  }

  return data;
};

const filterFound = function(
  root: ITranslateTree, filter: RegExp
): ITranslateTree {

  if (!root.dependencies) {
    return root;
  }

  // Mark all deps
  const toMark = [root];
  while (toMark.length) {
    const markPkg = toMark.shift();

    if (!markPkg) {
      continue;
    }

    const markDeps = markPkg.dependencies;

    if (!markDeps) {
      continue;
    }

    Object.keys(markDeps).forEach(function(depName) {
      const dep = markDeps[depName];

      if (dep.peerMissing) {
        return;
      }

      dep._parent = markPkg;

      if (depName.match(filter) !== null) {
        // If version is missing from arg, just do a name match.
        dep._found = 'explicit';
        let parent = dep._parent;
        while (parent && !parent._found && !parent._deduped) {
          parent._found = 'implicit';
          parent = parent._parent;
        }
      }

      toMark.push(dep);
    });
  }

  const toTrim = [root];
  while (toTrim.length) {
    const trimPkg = toTrim.shift();

    if (!trimPkg) {
      continue;
    }

    const trimDeps = trimPkg.dependencies;

    if (!trimDeps) {
      continue;
    }

    trimPkg.dependencies = {} as ITranslateTree;
    Object.keys(trimDeps).forEach(function(name) {
      const dep = trimDeps[name];

      if (!dep._found) {
        return;
      }

      if (dep._found === 'implicit' && dep._deduped) {
        return;
      }

      trimPkg.dependencies[name] = dep;
      toTrim.push(dep);
    });
  }

  return root;
};

// function filterByRegExp(data, filter) {
//   const dependencies = {};
//   Object.keys(data.dependencies).forEach(function(name) {
//    const dependency = data.dependencies[name];
//
//     if (filter.test(dependency.name)) {
//       dependencies[name] = dependency;
//     }
//   })
//   data.dependencies = dependencies;
// }

export default filterFound;
