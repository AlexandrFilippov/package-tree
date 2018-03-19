import * as fs from 'fs';
import ErrnoException = NodeJS.ErrnoException;
const rpt = require('read-package-tree');

interface IPackageJson {
    name: string;
    version: string;
}

interface IPackageNode {
    package: IPackageJson;
    children: IPackageNode[];
    parent: IPackageNode | null;
    path: string;
    realpath: string;
    isLink: boolean;
    target: object;
    error: string;
}

/**
 * Функция обработки пакета и генерации его дерева зависимостей.
 * @param {string} packagePath
 * @param {string} filterString
 */
export default function (packagePath: string, filterString: string) {
    const filter = new RegExp(filterString);
    let tree: string = '';

    rpt(packagePath, function (node: IPackageNode, kidName: string) {
        return filter.test(kidName);
    }, function (error: string, data: IPackageNode) {
        if (error) {
            return console.log('Ошибка:', error);
        }

        mapChild(data);

        fs.writeFile('package-tree.html', tree, function(err: ErrnoException) {
            if (err) throw err;
            console.log('Дерево зависимостей построено. Находится в файле package-tree.html');
        });
    });

    /**
     * Разбираем пакет и все его дочерние пакеты, генерируем список пакетов и дерево зависимостей в html.
     * @param packageNode
     */
    function mapChild(packageNode: IPackageNode) {
        if (!packageNode.error) {
            tree = tree + '<ul><li>' + packageNode.package.name + ' ' + packageNode.package.version + '</li>';

            if (packageNode.children && packageNode.children.length) {
                packageNode.children.map(mapChild);
            }

            tree = tree + '</ul>';
        }
    }
};
