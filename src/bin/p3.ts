import { getDependencies } from './../index';

const packagePath = process.argv[2];
const filter = process.argv[3] ? new RegExp(process.argv[3]) : /.*/;
const depth = process.argv[4];

getDependencies({ pathToPackageJson: packagePath, depth: +depth, filter });

/*
  getDependencies(packagePath, filter, depth)
    .then((objDeps) => baseFormater)
    .then((formatDeps) => htmlReporter);
 */

/*
  objDeps = {
    input: {
      packagePath: String
      filter: String
      depth: Number
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
