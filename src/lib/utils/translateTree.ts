import {packageId} from './package-id';
import moduleName from './module-name';

export function translateTree(tree: IPhysicalTree): ITranslateTree {
  const pkg = tree.package as ITranslateTree;

  if (pkg._dependencies) {
    return pkg;
  }

  pkg._dependencies = pkg.dependencies;
  pkg.dependencies = {} as ITranslateTree;
  tree.children.forEach(function(child: IPhysicalTree) {

    pkg.dependencies[moduleName(child)] = translateTree(child);

    // if (child.fakeChild) {
    //   dep.missing = true;
    //   dep.optional = child.package._optional;
    //   dep.requiredBy = child.package._spec;
    // }
  });

  function markMissing(name: string, requiredBy: ITranslateTree[]): void {
    if (pkg.dependencies[name]) {
      if (pkg.dependencies[name].missing) {
        return;
      }
      pkg.dependencies[name].invalid = true;
      pkg.dependencies[name].realName = name;
      pkg.dependencies[name].extraneous = false;
    } else {
      pkg.dependencies[name] = {
        requiredBy,
        missing: true,
        optional: !!pkg.optionalDependencies[name]
      };
    }
  }

  Object.keys(tree.missingDeps as {}).forEach(function(name) {
    markMissing(name, tree.missingDeps && tree.missingDeps[name] || []);
  });

  Object.keys(tree.missingDevDeps as {}).forEach(function(name) {
    markMissing(name, tree.missingDevDeps && tree.missingDevDeps[name] || []);
  });

  const checkForMissingPeers = (tree.parent ? [] : [tree])
    .concat(tree.children);
  checkForMissingPeers.filter(function(child) {
    return child.missingPeers;
  }).forEach(function(child) {
    Object.keys(child.missingPeers).forEach(function(pkgname) {
      const version = child.missingPeers[pkgname];
      let peerPkg = pkg.dependencies[pkgname];

      if (!peerPkg) {
        peerPkg = pkg.dependencies[pkgname] = {
          _id: pkgname + '@' + version,
          name: pkgname,
          version
        };
      }

      if (!peerPkg.peerMissing) {
        peerPkg.peerMissing = [];
      }
      peerPkg.peerMissing.push({
        requiredBy: packageId(child),
        requires: pkgname + '@' + version
      });
    });
  });
  pkg.path = tree.path;

  return pkg;
}
