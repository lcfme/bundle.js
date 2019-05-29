const inherits = require("util").inherits;
const path = require("path");
const createMod = require("./lib/mod");

module.exports = bundle;

function bundle(opts, cb) {
  opts = Object.assign(
    {
      baseDir: process.cwd()
    },
    opts
  );

  if (!opts.entry) {
    throw new TypeError(
      "options.entry is expected to be string type but got " + typeof opts.entry
    );
  }

  const entrypath = path.resolve(opts.baseDir, opts.entry);

  const mod = createMod(entrypath);
  mod.once("bundled", () => {
    const o = {};
    traverse(mod, mod => {
      o[mod.filepath] = createWrapperTemplate(mod.source);
    });
    const template = createTemplate(entrypath, o);
    cb(undefined, template);
  });
  mod.once("error", err => {
    cb(err);
  });
  mod.bundle();
}

function traverse(mod, visit) {
  visit(mod);
  for (let i = 0; mod.depMods && i < mod.depMods.length; i++) {
    traverse(mod.depMods[i], visit);
  }
}

function createTemplate(entrypath, mods) {
  let buf = [];
  buf.push(
    '(function(global,mods){var loadedModules={};function __require__(id){if(loadedModules[id]){return loadedModules[id].exports}var mod={_id:id,exports:{}};try{mods[id].call(global,mod.exports,mod,__require__)}finally{loadedModules[id]=mod}return mod.exports}return __require__("'
  );
  buf.push(entrypath);
  buf.push('")})(this,{');
  const files = Object.keys(mods);
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    buf.push('"' + file + '": ');
    buf.push(mods[file]);
    if (i !== files.length - 1) {
      buf.push(",");
    }
  }
  buf.push("});");
  return buf.join("");
}

function createWrapperTemplate(source) {
  return "function (exports, module, require) {" + source + "}";
}
