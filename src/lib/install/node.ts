function create(node: IPhysicalTree, template?: IPhysicalTree): IPhysicalTree {
  if (!template) {
    template = {} as IPhysicalTree;
  }
  Object.keys(template).forEach(function(key) {
    if (template
      && template[key] !== null
      && typeof template[key] === 'object'
      && !(template[key] instanceof Array)
    ) {

      if (!node[key]) {
        node[key] = {};
      }

      return create(node[key], template[key]);
    }

    if (node[key] != null) {
      return;
    }
    node[key] = template ? template[key] : null;
  });

  return node;
}

export function resetMetadata(node: IPhysicalTree): void {
  reset(node, new Set());
}

function reset(node: IPhysicalTree, seen: Set<IPhysicalTree>): void {
  if (seen.has(node)) {
    return;
  }

  seen.add(node);
  const child = create(node);

  child.isTop = false;
  child.requiredBy = [];
  child.missingDeps = {} as IPackageJson;
  child.missingDevDeps = {} as IPackageJson;

  // tslint:disable-next-line
  child.children.forEach(function(child) { reset(child, seen); });
}
