declare module 'read-installed' {
    import ErrnoException = NodeJS.ErrnoException;

    function internal(where: string, options: object, callback: (er: ErrnoException, deps: IRootPackage) => void): void;
    namespace internal {}

    export = internal;
}

declare module 'topiary' {
    function internal(prepped: IPackageWithArrayDependencies, type: string, options: object): string;
    namespace internal {}

    export = internal;
}

interface IPackageDependencies {
    [key: string]: IRootPackage
}

interface IPackageNode {
    name: string;
    version: string;
    parent: IPackageNode | any;
}

interface IRootPackage extends IPackageNode {
    dependencies: IPackageDependencies;
}

interface IPackageWithArrayDependencies extends IPackageNode {
    dependencies: IPackageWithArrayDependencies[];
}

interface IFileExtensionConfig {
    [key: string]: (data: IRootPackage, depth: number, filter: RegExp) => string;
}