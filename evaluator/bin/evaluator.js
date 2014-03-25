#!/usr/bin/env node
var cube = require("cube");
cube.server(require("./config")).use(cube.evaluator.register).start();
