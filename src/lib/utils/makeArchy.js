var archy = require('archy');
// import archy from 'archy';
import * as sortedObject from 'sorted-object';

const makeArchy = function(data: IRootPackage, long: boolean, dir: string): IRootPackage {
  const out = makeArchy_(data, long, dir, 0, null, null);
  return archy(out, '', { unicode: false });
  // return archy(out, '', { unicode: npm.config.get('unicode') })
};

function makeArchy_(
  data: IRootPackage,
  long: boolean,
  dir: string,
  depth: number,
  parent: IRootPackage,
  dep: string
): IRootPackage {

  // console.log(dep);
  if (data.missing) {
    if (depth - 1 <= Infinity) {
      // if (depth - 1 <= npm.config.get('depth')) {
      // just missing
      const unmet = 'UNMET ' + (data.optional ? 'OPTIONAL ' : '') + 'DEPENDENCY'
      let label = data._id || (dep + '@' + data.requiredBy);
      if (data._found === 'explicit' && data._id) {
        label = label.trim() + ' ';
      }

      return {
        label: unmet + ' ' + label,
        nodes: Object.keys(data.dependencies || {})
          .sort(alphasort).filter(function(i) {
            return !isCruft(data.dependencies[i]);
          }).map(function(item) {
            return makeArchy_(sortedObject(data.dependencies[item]),
              long,
              dir,
              depth + 1,
              data,
              dep);
          })
      };
    } else {
      return {label: dep + '@' + data.requiredBy};
    }
  }

  const out = {};
  // the top level is a bit special.
  out.label = data._id || '';

  if (data._found === 'explicit' && data._id) {
    out.label = out.label.trim() + ' ';
  }

  if (data.link) {
    out.label += ' -> ' + data.link;
  }

  if (data._deduped) {
    out.label += ' deduped';
  }

  if (data.invalid) {
    if (data.realName !== data.name) {
      out.label += ' (' + data.realName + ')';
    }
    const invalid = 'invalid';
    // if (npm.color) invalid = color.bgBlack(color.red(invalid))
    out.label += ' ' + invalid;
  }

  if (data.peerInvalid) {
    const peerInvalid = 'peer invalid';
    // if (npm.color) peerInvalid = color.bgBlack(color.red(peerInvalid))
    out.label += ' ' + peerInvalid;
  }

  if (data.peerMissing) {
    const peerMissing = 'UNMET PEER DEPENDENCY';

    // if (npm.color) peerMissing = color.bgBlack(color.red(peerMissing))
    out.label = peerMissing + ' ' + out.label;
  }

  if (data.extraneous && data.path !== dir) {
    const extraneous = 'extraneous';
    // if (npm.color) extraneous = color.bgBlack(color.green(extraneous))
    out.label += ' ' + extraneous;
  }

  if (data.error && depth) {
    let message = data.error.message;

    if (message.indexOf('\n')) {
      message = message.slice(0, message.indexOf('\n'));
    }
    const error = 'error: ' + message;
    // if (npm.color) error = color.bgRed(color.brightWhite(error))
    out.label += ' ' + error;
  }

  // add giturl to name@version
  if (data._resolved) {
    try {
      const type = npa(data._resolved).type;
      const isGit = type === 'git' || type === 'hosted';
      if (isGit) {
        out.label += ' (' + data._resolved + ')';
      }
    } catch (ex) {
      // npa threw an exception then it ain't git so whatev
    }
  }

  // now all the children.
  out.nodes = [];
  if (depth <= Infinity) {
    // if (depth <= npm.config.get('depth')) {
    out.nodes = Object.keys(data.dependencies || {})
      .sort(alphasort).filter(function(d) {
        return !isCruft(data.dependencies[d]);
      }).map(function(d) {
        return makeArchy_(sortedObject(data.dependencies[d]),
          long,
          dir,
          depth + 1,
          data,
          d);
      });
  }

  if (out.nodes.length === 0 && data.path === dir) {
    out.nodes = ['(empty)'];
  }

  return out;
}

function alphasort(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return a > b ? 1
    : a < b ? -1 : 0;
}

function isCruft(data) {
  return data.extraneous && data.error && data.error.code === 'ENOTDIR';
}

export default makeArchy;
