const isProdDep = function(node: IPhysicalTree, name: string): string {
  return node.package &&
    node.package.dependencies &&
    node.package.dependencies[name] || '';
};

export default isProdDep;
