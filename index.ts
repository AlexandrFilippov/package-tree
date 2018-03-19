import inspector from './src/inspector';

if (process.argv.length <= 2) {
    console.log('Запуск: ' + __filename + ' {path/to/package.json} ' + '"^(react|redux|ufs).*$"');
    process.exit(-1);
}

const packagePath = process.argv[2];
const filter = process.argv[3] && process.argv[3].length ? process.argv[3] : '.*';

inspector(packagePath, filter);
