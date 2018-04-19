import union = require('lodash.union');
import without = require('lodash.without');
import { flattenTree } from '../install/flatten-tree';

interface ISeen {
  [path: string]: boolean;
}

function isDisconnectedCycle(
  tree: IPhysicalTree,
  seen?: ISeen
): IPhysicalTree | boolean {

  if (!seen) {
    seen = {};
  }

  if (tree.isTop || tree.cycleTop || tree.requiredBy.length === 0) {
    return false;
  } else if (seen[tree.path]) {
    return true;
  } else {
    seen[tree.path] = true;
    return tree.requiredBy.every(function(node: IPhysicalTree) {
      return isDisconnectedCycle(node, Object.create(seen || {}));
    });
  }
}

export function mutateIntoLogicalTree(
  tree: IPhysicalTree
): IPhysicalTree {

  const flat = flattenTree(tree);

  Object.keys(flat).sort().forEach(function(flatname) {
    const node = flat[flatname];

    if (!(node.requiredBy && node.requiredBy.length)) {
      return;
    }

    if (node.parent) {
      if (isDisconnectedCycle(node)) {
        node.cycleTop = true;
      } else if (node.requiredBy.length) {
        node.parent.children = without(node.parent.children, node);
      }
    }

    node.requiredBy.forEach(function(parentNode: IPhysicalTree) {
      parentNode.children = union(parentNode.children, [node]);
    });
  });

  return tree;
}
