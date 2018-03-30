interface IAnyDependenciesPackageJson {
  [nameDependency: string]: IExtendedPackageJson;
}

interface IExtendedPackageJson {
  name: string;
  version: string;
  dependencies?: IAnyDependenciesPackageJson;
  devDependencies?: IAnyDependenciesPackageJson;
  peerDependencies?: IAnyDependenciesPackageJson;
}

interface IOptionsForGetDependencies {
  pathToPackageJson?: string;
  depth?: number;
}

type TGetDependencies = (options: IOptionsForGetDependencies) => {
  input: IOptionsForGetDependencies;
  output: IExtendedPackageJson;
};

const getDependencies: TGetDependencies = function(options) {
  // TODO: implementation
  return (options as any);
};

export default getDependencies;
