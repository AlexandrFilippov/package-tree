const isDevDep = function(node: IPhysicalTree, name: string): string {
  return node.package &&
    node.package.devDependencies &&
    node.package.devDependencies[name] || '';
};

export default isDevDep;
