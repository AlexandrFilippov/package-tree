declare module 'read-package-tree' {
  import ErrnoException = NodeJS.ErrnoException;

  function internal(
    path: string, callback: (
      er: ErrnoException, physicalTree: IPhysicalTree) => void): void;

  namespace internal {
  }

  export = internal;
}

declare module 'path' {
  export function relative(from: string, to: string): string;
}

declare module 'semver' {
  export function satisfies(
    version1: string, version2: string | null, range: boolean
  ): boolean;
}

declare module 'sorted-object' {
  export function sotredObject(pkg: object): object;
}

interface IPackageJson {
  [key: string]: any;
  name: string;
  version: string;
  dependencies?: {[key: string]: string};
  devDependencies?: {[key: string]: string};
}

interface IPhysicalTree {
  [key: string]: any;
  package: IPackageJson;
  parent: IPhysicalTree | null;
  children: IPhysicalTree[];
  path: string;
  realpath: string;
  isTop?: boolean;
  removed?: IPhysicalTree;
  missingDeps?: IPackageJson;
  missingDevDeps?: IPackageJson;
}

interface ITranslateTree extends IPackageJson {
  dependencies: ITranslateTree;
}
