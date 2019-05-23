const bundle = require("../");
const fs = require("fs");
bundle(
  {
    baseDir: __dirname,
    entry: "./a.js"
  },
  (err, code) => {
    if (err) {
      return;
    }
    fs.writeFile(__dirname + "/dist.js", code, err => {
      if (err) {
        throw err;
      }
    });
  }
);
