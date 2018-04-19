import * as rpt from 'read-package-tree';
import { computeMetadata } from './lib/install/deps';
import { mutateIntoLogicalTree } from './lib/utils/mutateIntoLogicalTree';
import { translateTree } from './lib/utils/translateTree';
import { unloop, filterByDepth } from './lib/utils/filters';
import filterFound from './lib/utils/filters';
// TODO delete
// import makeArchy from './lib/utils/makeArchy';

interface IGetDependenciesOptions {
  pathToPackageJson?: string;
  depth?: number;
  filter?: RegExp;
}

type TGetDependencies = (options?: IGetDependenciesOptions) => Promise<{
  input: IGetDependenciesOptions;
  output: ITranslateTree;
}>;

const getDependencies: TGetDependencies = function(options = {}) {
  const path: string = options.pathToPackageJson
    ? options.pathToPackageJson.replace('package.json', '')
    : './';
  const depth: number = typeof options.depth !== 'number'
    ? Number.MAX_VALUE
    : options.depth;
  const filter: RegExp = options.filter ? options.filter : /.*/;

  return new Promise((resolve, reject) => {
    rpt(path, (err, physicalTree: IPhysicalTree) => {
      if (err) {
        return reject(err);
      }

      const data = computeMetadata(physicalTree);
      const tree = mutateIntoLogicalTree(data);
      const translatedTree = translateTree(tree);
      const unlooped = filterFound(unloop(translatedTree), filter);
      const limited = filterByDepth(unlooped, depth);

      // TODO delete
      // const out = makeArchy(limited, false, './');
      // console.log(out);

      return resolve({
        input: options,
        output: limited
      });
    });
  });
};

export default getDependencies;
