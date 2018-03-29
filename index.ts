import ls from './src/ls';
  // { getDependencies, baseFormater, htmlReporter }

if (process.argv.length <= 2) {
  console.log('Запуск: ' + __filename + ' {path/to/package.json} ' + '"^(react|redux|ufs).*$"');
  process.exit(-1);
}

const packagePath = process.argv[2];
// const filter = process.argv[3] && process.argv[3].length ? process.argv[3] : '.*';
const filter = process.argv[3] ? new RegExp(process.argv[3]) : /.*/;
const extension = process.argv[4];
const depth = process.argv[5] == null ? Number.MAX_VALUE : +process.argv[5];

ls(packagePath, filter, extension, depth);

/* 
  getDependencies(packagePath, filter, depth)
    .then((objDeps) => baseFormater)
    .then((formatDeps) => htmlReporter);
 */

/*
  objDeps = {
    input: {
      packagePath: 
      filter: 
      depth: 
    },
    output: {
      name: 'aurora',
      version: '0.0.1',
      dependencies: {
        'react': {
          'name': 'react',
          'version': '0.14.8'
        }
      }
    }
  }
*/

/*
  formatDeps = {
    input: {
      packagePath:
      filter:
      depth:
    },
    output: {
      'aurora@0.0.1': {
        'react:@0.14.8': {}
      }
    }
  }
*/



