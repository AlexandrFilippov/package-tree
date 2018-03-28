import ls from './src/ls';

if (process.argv.length <= 2) {
    console.log('Запуск: ' + __filename + ' {path/to/package.json} ' + '"^(react|redux|ufs).*$"');
    process.exit(-1);
}

const packagePath = process.argv[2];
const filter = process.argv[3] && process.argv[3].length ? process.argv[3] : '.*';
const extension = process.argv[4];
const depth = process.argv[5] == null ? Number.MAX_VALUE : +process.argv[5];

ls(packagePath, filter, extension, depth);