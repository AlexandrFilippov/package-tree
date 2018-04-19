import { resetMetadata } from './node';
import npa = require('npm-package-arg');
import moduleName from '../utils/module-name';
import isDevDep from './is-dev-dep';
import isProdDep from './is-prod-dep';
import * as semver from 'semver';

interface IComputeMetadata extends IPhysicalTree {
  parent: IComputeMetadata;
  isTop: boolean;
  package: IPackageJson;
  path: string;
}

interface IDep {
  isDep: boolean;
  isDevDep: boolean | npa.Result;
  isProdDep: boolean | npa.Result;
}

export function computeMetadata(
  tree: IPhysicalTree
): IComputeMetadata | IPhysicalTree {

  if (tree.parent == null) {
    resetMetadata(tree);
    tree.isTop = true;
  }

  function findChild(name: string, spec: string): void | boolean {
    let req;

    try {
      req = childDependencySpecifier(tree, name, spec);
    } catch (err) {
      return;
    }

    const child = findRequirement(tree, req.name, req);

    if (child) {
      addRequiredDep(tree, child);
      return true;
    }

    return;
  }

  const deps = tree.package.dependencies || {} as { [key: string]: any };

  for (const name of Object.keys(deps)) {
    if (findChild(name, deps[name]) || !tree.missingDeps) {
      continue;
    }

    tree.missingDeps[name] = deps[name];
  }

  if (tree.isTop) {
    const devDeps = tree.package.devDependencies
      || {} as { [key: string]: any };

    for (const name of Object.keys(devDeps)) {
      if (findChild(name, devDeps[name]) || !tree.missingDevDeps) {
        continue;
      }

      tree.missingDevDeps[name] = devDeps[name];
    }
  }

  tree.children.filter((child) => !child.removed).forEach((child) => {
    computeMetadata(child);
  });

  return tree;
}

function doesChildVersionMatch(
  child: boolean | IPhysicalTree | null,
  requested: npa.Result
): boolean {

  try {
    return child !== null && typeof child === 'object'
      ? semver.satisfies(child.package.version, requested.fetchSpec, true)
      : false;
  } catch (e) {
    return false;
  }
}

function childDependencySpecifier(
  tree: IPhysicalTree,
  name: string,
  spec: string
): npa.Result {
  return npa.resolve(name, spec, packageRelativePath(tree));
}

function packageRelativePath(tree: IPhysicalTree): string {
  if (!tree) {
    return '';
  }

  return tree.path;
}

// Determine if a module requirement is already met by the tree at or above
// our current location in the tree.
export const findRequirement = function(
  tree: IPhysicalTree,
  name: string | null,
  requested: npa.Result
): IPhysicalTree | null {

  const nameMatch = function(child: IPhysicalTree): boolean {
    return !!(
      moduleName(child) === name && child && child.parent && !child.removed
    );
  };

  const versionMatch = function(child: IPhysicalTree | null): boolean {
    return doesChildVersionMatch(child, requested);
  };

  if (nameMatch(tree)) {
    // this *is* the module, but it doesn't match the version, so a
    // new copy will have to be installed
    return versionMatch(tree) ? tree : null;
  }

  let matches = tree ? tree.children.filter(nameMatch) : [];

  if (matches.length) {
    matches = matches.filter(versionMatch);
    // the module exists as a dependent, but the version doesn't match, so
    // a new copy will have to be installed above here
    if (matches.length) {
      return matches[0];
    }

    return null;
  }

  if (!tree || tree.isTop) {
    return null;
  }

  return tree.parent ? findRequirement(tree.parent, name, requested) : null;
};

function isDep(
  tree: IPhysicalTree, child: IPhysicalTree
): IDep {

  const name = moduleName(child);
  const prodVer = isProdDep(tree, name);
  const devVer = isDevDep(tree, name);
  let prodSpec;

  try {
    prodSpec = childDependencySpecifier(tree, name, prodVer);
  } catch (err) {
    return {isDep: true, isProdDep: false, isDevDep: false};
  }

  let matches;

  if (prodSpec) {
    matches = doesChildVersionMatch(child, prodSpec);
  }

  if (matches) {
    return {isDep: true, isProdDep: prodSpec, isDevDep: false};
  }

  try {
    const devSpec = childDependencySpecifier(tree, name, devVer);
    return {
      isDep: doesChildVersionMatch(child, devSpec),
      isProdDep: false,
      isDevDep: devSpec
    };
  } catch (err) {
    return {isDep: false, isProdDep: false, isDevDep: false};
  }
}

function addRequiredDep(
  tree: IPhysicalTree, child: IPhysicalTree
): boolean {

  const dep = isDep(tree, child);

  if (!dep.isDep) {
    return false;
  }

  replaceModuleByPath(child, 'requiredBy', tree);
  replaceModuleByName(tree, 'requires', child);

  if (dep.isProdDep && tree.missingDeps) {
    delete tree.missingDeps[moduleName(child)];
  }

  if (dep.isDevDep && tree.missingDevDeps) {
    delete tree.missingDevDeps[moduleName(child)];
  }

  return true;
}

exports._replaceModuleByPath = replaceModuleByPath;
function replaceModuleByPath(
  obj: IPhysicalTree,
  key: string,
  child: IPhysicalTree
): IPhysicalTree | undefined {

  return replaceModule(
    obj,
    key,
    child,
    // tslint:disable-next-line
    function(replacing: IPhysicalTree, child: IPhysicalTree): boolean {
      return replacing.path === child.path;
    }
  );
}

exports._replaceModuleByName = replaceModuleByName;
function replaceModuleByName(
  obj: IPhysicalTree,
  key: string,
  child: IPhysicalTree
): IPhysicalTree | undefined {

  const childName = moduleName(child);
  return replaceModule(obj, key, child, function(replacing: IPhysicalTree) {
    return moduleName(replacing) === childName;
  });
}

function replaceModule(
  obj: IPhysicalTree,
  key: string,
  child: IPhysicalTree,
  matchBy: (
    replacing: IPhysicalTree, child: IPhysicalTree
  ) => boolean): IPhysicalTree | undefined {

  if (!obj[key]) {
    obj[key] = [];
  }

  const children = [].concat(obj[key]) as IPhysicalTree[];
  let replaceAt;

  for (replaceAt = 0; replaceAt < children.length; ++replaceAt) {
    if (matchBy(children[replaceAt], child)) {
      break;
    }
  }

  const replacing = children.splice(replaceAt, 1, child);
  obj[key] = children;
  return replacing[0];
}
