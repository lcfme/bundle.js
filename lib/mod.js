const inherits = require("util").inherits;
const EE = require("events").EventEmitter;
const fs = require("fs");
const path = require("path");
const esprima = require("esprima");

const Syntax = esprima.Syntax;

const globalCache = {};

function readFile(path, options) {
  return new Promise((r, j) => {
    fs.readFile(path, options, (err, data) => {
      if (err) {
        j(err);
        return;
      }
      r(data);
    });
  });
}

function createMod(filepath, dirpath) {
  if (globalCache[filepath]) {
    return globalCache[filepath];
  }
  return new Mod(filepath, dirpath);
}

module.exports = createMod;

inherits(Mod, EE);

function Mod(filepath, dirpath) {
  if (!(this instanceof Mod)) {
    return new Mod(filepath, dirpath);
  }
  this.filepath = filepath;
  this.dirpath = dirpath || path.dirname(filepath);
  this.source = null;
  this.deps = null;
  this.depMods = null;
  this.errors = null;
  this.bundled = false;
  this.runBundled = false;

  globalCache[filepath] = this;
}

Mod.prototype.bundle = function() {
  if (this.bundled) {
    return Promise.resolve(this);
  } else if (this.runBundled) {
    return new Promise((r, j) => {
      this.once("bundled", () => {
        r(this);
      });
      this.once("error", err => {
        j(err);
      });
    });
  }
  this.runBundled = true;
  console.log(this.filepath);
  return this._readFile()
    .then(() => this._parseDep())
    .then(() => {
      this.bundled = true;
      this.emit("bundled", this);
      return this;
    })
    .catch(err => {
      (this.errors || (this.errors = [])).push(err);
      try {
        this.emit("error", err);
      } finally {
        throw err;
      }
    });
};

Mod.prototype._readFile = function() {
  return readFile(this.filepath, { encoding: "utf8" }).then(source => {
    this.source = source;
    return this;
  });
};

Mod.prototype._parseDep = function() {
  return new Promise((r, j) => {
    let replacements = [];
    let depPromises = [];
    let source = this.source;
    function match(node) {
      return (
        node.type === Syntax.CallExpression &&
        node.callee.type === Syntax.Identifier &&
        node.callee.name === "require"
      );
    }
    esprima.parseScript(source, { tolerant: true }, (node, meta) => {
      if (match(node)) {
        if (
          node.arguments[0] === undefined ||
          node.arguments[0].type !== Syntax.Literal
        ) {
          throw new TypeError(
            "require is expect to have exactly one argument. "
          );
        }
        replacements.push({
          node,
          meta,
          depvalue: path.resolve(this.dirpath, node.arguments[0].value)
        });
      }
    });

    if (replacements.length) {
      replacements.sort((a, b) => {
        return b.meta.start.offset - a.meta.start.offset;
      });

      for (let i = 0; i < replacements.length; i++) {
        let r = replacements[i];
        source =
          source.slice(0, r.meta.start.offset) +
          'require("' +
          r.depvalue +
          '")' +
          source.slice(r.meta.end.offset);
      }
      this.source = source;
      this.deps = replacements.map(i => i.depvalue);
      this.depMods = this.deps.map(dep => createMod(dep));
      depPromises = this.deps.map(dep => createMod(dep).bundle());
    }

    Promise.all(depPromises)
      .then(() => {
        r(this);
      })
      .catch(err => {
        j(err);
      });
  });
};
