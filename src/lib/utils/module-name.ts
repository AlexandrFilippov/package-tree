import * as path from 'path';

module.exports.test = {};

module.exports.test.pathToPackageName = pathToPackageName;
function pathToPackageName(dir: string): string {
  if (dir == null) {
    return '';
  }

  if (dir === '') {
    return '';
  }

  const name = path.relative(path.resolve(dir, '..'), dir);
  const scoped = path.relative(path.resolve(dir, '../..'), dir);

  if (scoped[0] === '@') {
    return scoped.replace(/\\/g, '/');
  }

  return name.trim();
}

module.exports.test.isNotEmpty = isNotEmpty;
function isNotEmpty(str: string): boolean {
  return str !== null && str !== '';
}

let unknown = 0;
const moduleName = function(tree: IPhysicalTree): string {
  const pkg = tree.package || tree;

  if (isNotEmpty(pkg.name) && typeof pkg.name === 'string') {
    return pkg.name.trim();
  }

  const pkgName = pathToPackageName(tree.path);

  if (pkgName !== '') {
    return pkgName;
  }

  if (tree._invalidName != null) {
    return tree._invalidName;
  }

  tree._invalidName = '!invalid#' + (++unknown);
  return tree._invalidName;
};

export default moduleName;
