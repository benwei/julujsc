/**********************************
* JuluParser is a c-like parser
* test cases for ast
*
* (c) ben@staros.mobi (2012)
* License: MIT-like License
***********************************/

var JUast = require('../juluc/ast')

var opf = JUast()

var exp1 = opf.make_binary_op("+", "x", 3)
var exp2 = opf.make_binary_op("+", opf.make_binary_op("-", "x", 2), 3);

opf.dumpast(exp1);
opf.dumpast(exp2);
