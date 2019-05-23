(function(global,mods){var loadedModules={};function __require__(id){if(loadedModules[id]){return loadedModules[id].exports}var mod={_id:id,exports:{}};try{mods[id].call(global,mod.exports,mod,__require__)}finally{loadedModules[id]=mod}return mod.exports}__require__("/Users/lcfme/Desktop/bundle.js/test/a.js")})(this,{"/Users/lcfme/Desktop/bundle.js/test/a.js": function (exports, module, require) {const b = require("/Users/lcfme/Desktop/bundle.js/test/b.js");
const c = require("/Users/lcfme/Desktop/bundle.js/test/c.js");

console.log(b, c);
},"/Users/lcfme/Desktop/bundle.js/test/c.js": function (exports, module, require) {module.exports = "Hello World";
},"/Users/lcfme/Desktop/bundle.js/test/b.js": function (exports, module, require) {const c = require("/Users/lcfme/Desktop/bundle.js/test/c.js");
exports.c = c;
exports.b = "b";
}});