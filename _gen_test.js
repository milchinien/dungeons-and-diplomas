var fs = require("fs");
var BT = String.fromCharCode(96);
var SQ = String.fromCharCode(39);
var DQ = String.fromCharCode(34);
var lines = [];
lines.push("import { test, expect } from " + SQ + "@playwright/test" + SQ + ";");
