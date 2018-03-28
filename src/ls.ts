import * as assert from 'assert';
import * as fs from 'fs';
import * as readInstalled from 'read-installed';
import * as topiary from 'topiary';
import ErrnoException = NodeJS.ErrnoException;

const dirName: string = 'package-tree-output';
const fileName: string = 'package-tree';

export default function(path: string, filter: string, extension: string, depth: number) {
    const where = path;
    const regexp = new RegExp(filter);

    read(where, function(error: null | ErrnoException, data: IRootPackage) {
        if (error) {
            throw error
        }

        const extensionsConfig: IFileExtensionConfig = {
            'txt': printable,
            'html': toHtml
        };

        if (!extensionsConfig[extension]) {
            throw 'Доступные расширения: txt, html'
        }

        const result = extensionsConfig[extension](data, depth, regexp);

        if (fs.existsSync(path + '/' + dirName)) {
            writeResult(path, extension, result);
        } else {
            fs.mkdir(path + '/' + dirName, function(error) {
                if (error) {
                    throw error
                }
            });
            writeResult(path, extension, result);
        }
    });
};

function writeResult(path: string, extension: string, result: string) {
    fs.writeFile(path + '/' + dirName + '/' + fileName + '.' + extension, result, function(error: ErrnoException) {
        if (error) {
            throw error
        }

        console.log('Дерево зависимостей построено. Находится в файле ' + path + '/' + dirName + '/' + fileName + '.' + extension);
    });
}

function read(where: string, callback: (error: null | ErrnoException, deps: IRootPackage) => void) {
    const options = { dev: true };

    readInstalled(where, options, function(error, deps) {
        if (error) {
            return callback(error, deps);
        }

        deps = stripCircular(deps);

        return callback(null, deps);
    });
}

function stripCircular(deps: IRootPackage) {
    const stack: IRootPackage[] = [];

    return strip(deps);

    function strip(deps: IRootPackage) {
        stack.push(deps);

        delete deps.parent;

        if (typeof deps === 'object' && 'dependencies' in deps) {
            for (const pkg in deps.dependencies) {
                if (stack.indexOf(deps.dependencies[pkg]) >= 0)
                    delete deps.dependencies[pkg]; // Delete circular deps
                else
                    deps.dependencies[pkg] = strip(deps.dependencies[pkg]);
            }
        }

        stack.pop();

        return deps;
    }
}

function convertToArray(deps: IRootPackage): IPackageWithArrayDependencies {
    const tmp: IPackageWithArrayDependencies = { ...deps, dependencies: [] };

    if (typeof deps === 'object' && 'dependencies' in deps) {
        tmp.dependencies = Object.keys(deps.dependencies).map(dependencyName => {
            return convertToArray(deps.dependencies[dependencyName]);
        });
    }

    return tmp;
}

function limitDepth(deps: IRootPackage, depth: number): IRootPackage {
    if (depth < 0) {
        delete deps.dependencies;
        return deps;
    }

    if (typeof deps === 'object' && 'dependencies' in deps) {
        for (const pkg in deps.dependencies) {
            deps.dependencies[pkg] = limitDepth(deps.dependencies[pkg], depth - 1);
        }
    }

    return deps;
}

function printable(data: IRootPackage, depth: number, filter: RegExp): string {
    assert(depth != null, 'depth is mandatory');
    const options = {
        name: (obj: IRootPackage) => obj.name + '@' + obj.version,
        filter: (obj: IRootPackage) => filter.test(obj.name)
    };
    const limited = limitDepth(data, depth);
    // topiary requires dependencies to be an array, not an object
    const prepped = convertToArray(limited);

    return topiary(prepped, 'dependencies', options);
}

function toHtml(data: IRootPackage, depth: number, filter: RegExp): string {
    const limited = limitDepth(data, depth);
    const prepped = convertToArray(limited);
    const projectName = '<h2>' + prepped.name + '@' + prepped.version + '</h2>';
    let treeHtml = '<html><body><ul>' + projectName;

    prepped.dependencies.forEach(mapDep);

    function mapDep(dependency: IPackageWithArrayDependencies): void {
        if (filter.test(dependency.name)) {
            treeHtml = treeHtml + '<li>' + dependency.name + '@' + dependency.version;

            if (dependency.dependencies && dependency.dependencies.length) {
                treeHtml = treeHtml + '<ul>';
                dependency.dependencies.forEach(mapDep);
                treeHtml = treeHtml + '</ul></li>';
            }
        }
    }

    treeHtml = treeHtml + '</ul></body></html>';

    return treeHtml;
}
