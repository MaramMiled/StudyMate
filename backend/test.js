import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const { PDFParse } = require("pdf-parse");

console.log(PDFParse);

const parser = new PDFParse();

console.log(parser);