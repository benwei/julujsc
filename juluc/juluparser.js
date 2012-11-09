/***********************************
 JuluParser is a c-like parser
 Copyright (C) 2012 Ben Wei (ben@staros.mobi)

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 self software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do
 so, subject to the following conditions:

 The above copyright notice and self permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

*************************************
 use javascript to implement 
 features:
 <a> assign
 <b> if (expr) { block0 } else { block1 }
 <c> function
    - print(Variable|string|integer)
    - push(Variable)
    - pop(toVariable)

*************************************

 TODO: AST & Function Table
 reference: 
 * http://en.wikipedia.org/wiki/Abstract_syntax_tree
 root --> assign(a=1) --> assign(c=3) --> 
 branch-if --> (cond expr)
    +-> block1 -->
    +-> block2 -->       

 a --> = --> b
        
         \-> c
 case 2: functions
 step1:
 symt = { 'func': 'print(a)' }
 step2:
 symt = { 'func': [ print_ptr, op1 ] }
   (note: opt1 point to 'a' variable)
 func tree: use name -> get tree
*************************************/

var util = require('util')

function JuluParser(code) {
    var self = this;

    self.verbose = 0;
    self.blocknum = 0;
    self.word = '';
    self.code = code;
    self.stacks = [];
    self.symtable = {};
    self.vars = {}
    self.skipElse = false
    self.condblock = 0

    function dlog(msg) {
        if (self.verbose)
            console.log(msg)
    }

    function derr(msg) {
        print(msg)
    }

    function print(msg) {
        console.log(msg)
    }

    self.docalc = function (op, l, r) {
        switch(op) {
        case '+':
        return l + r;
        case '-':
        return l - r;
        case '*':
        return l * r;
        case '/':
        return l / r;
        }
        return 0;
    }

    self.getValue = function (data, base) {
        var w = '';
        var c, op = '';
        var i = 1
        var cal = 0;
        var tstack = [];
        while((c = data[base+i]) != ' ') {
            if (c == '(') {
                tstack.push(c)
            } else if (c == ')') {
                var r = parseInt(w);
                w = ''
                dlog("====>" + tstack)
                while(tstack.length) {
                    op = tstack.pop()
                    if (op == '(') {
                        break;
                    }
                    var l = tstack.pop()
                    r = self.docalc(op, l, r)
                }
                dlog("====>" + r + " --- " + tstack)
                w = r;
                cal = 1;
            } else if ('+-*/'.indexOf(c) != -1) {
                tstack.push(parseInt(w));
                tstack.push(c)
                w = '';
            } else {
                w+=c;
            }
            if (data.length > (base + i)
                 && (cal == 0
                    && c == ')')) {
                break;
            }
            i++;
        }

        if (tstack.length > 0) {
            var r = parseInt(w)
            dlog("====>r(" + r + ") ," + tstack)
            while(tstack.length) {
                op = tstack.pop()
                l = tstack.pop()
                r = self.docalc(op, l, r)
            }
            w = r;
        }

        dlog("value=" + w);
        return [i, w];
    } 
    
    self.isAlpha = function (c) {
        return (c <= 'z' && c >='a')
    }

    self.varValue = function (vname) {
        return self.vars[vname + self.blocknum]
    }

    self.VarSetValue = function (vname, value) {
        self.vars[vname + self.blocknum] = value;
    }

    var types = {
        void: 1,
	str: 2,
	int: 3 
    };

    self.getFuncWord = function (data, base) {
	var c, i = 0;
	var quote_left = 0;
	var type = types.void;
	var w = '';
	while(base+i < data.length) {
	    i++;
	    c = data[base+i];
  	    if (c == "'") {
		if (quote_left == 0) {
		    quote_left = 1;
		    type = type.str;
		} else if (quote_left == 1){
		    quote_left = 0;
		} else {
		    w+=c;
		}
	    } else if (c == '"') {
		if (quote_left == 0) {
		    quote_left = 2;
		    type = type.str;
		} else if (quote_left == 2) {
		    quote_left = 0;
		} else {
		    w+=c;
		}
	    } else if (quote_left) {
		w+=c;    
	    } else if(c ==')') {
		    break;
	    } else {
		    w+=c;
	    }
	}
	dlog("getFuncWord: " + w);
	return [i, w, type];
    }

    self.doFunc = function (funcname, data, base) {
	    var prev_token = '';
	    var w,n,t;
	    dlog("func:" + funcname);
	    var arr = self.getFuncWord(data, base);
	    n = arr[0];
	    w = arr[1];
	    t = arr[2];
	    var m;
	    if (w.length && t == types.void && self.isAlpha(w[0])) {
		    m = self.varValue(w);
		    if (m) {
			    dlog("var "+ w +" assign:"+ m);
			    w = m;
		    }
	    }

	    if (self.condblock == 1 && self.skipElse == false) {
		    dlog("skip block 0")
	    } else if (self.condblock == 2 && self.skipElse == true) {
		    dlog("skip block 1")
	    } else if (funcname == 'push') {
		    self.stacks.push(w)
	    } else if (funcname == 'pop') {
		    if (w.length > 0) {
			    var v = self.stacks.pop()
				    self.VarSetValue(w, v);
		    } else {
			    self.stacks.pop()  // throw the stack value;
		    }
	    } else if (funcname == 'print') {
		    // put symtable
		    if (m)
			print(m);
		    else
			print(w); 
	    } else {
		    // custom symbol
		    print("symbol not found: " + funcname);
	    }
	    return n;
    }

    self.ifexpr = function (code, base) {
	    dlog('match if')
		    var i = 0;
	    while ((c = code[base + i]) != '(') {
		    i++;
	    }

	    var arr = self.getValue(code, base+i)
		    if (arr[0] == 0) {
			    // error
			    derr('wrong if expr');
			    assert(arr[0] > 0, 'wrong if expr')
		    }
	    self.stacks.push(arr[1]+ self.blocknum);
	    return arr[0]
    }

    self.eq = function (code, base) {
	    dlog('match eq')
		    var token = self.stacks.pop()
		    var value = self.vars[token];
	    var arr = self.getValue(code, base)
		    dlog(token + '(' + value + ') v.s. d(' + arr[1] + ')')
		    self.skipElse = (value == arr[1])
		    dlog('if expr is ' + self.skipElse)
		    return arr[0]
    }

    self.getblock = function (code, base) {
	    dlog('match else')
		    return 0
    }

    TOKEN_OP=0
	    TOKEN_IF=1
	    TOKEN_ELSE=2
	    TOKEN_EQ=2
	    self.block = 0

	    self.kw = {
		    'if': {token: TOKEN_IF, call: self.ifexpr},
		    'else': {token: TOKEN_ELSE, call: self.getblock},
		    'eq': {token: TOKEN_EQ, call: self.eq},
	    }

    self.assign = function (code, base) {
	    dlog("word:" + self.word)
		    var name = self.word + self.blocknum;
	    var arr = self.getValue(code, base)
		    self.vars[name] = arr[1]
		    return arr[0]
    }

    self.parseOP = function (c, code, base) {
	    var i = base;
	    if (c == '='){
		    self.assign(code, i);
		    self.word = ''
	    }else if(c == ' ') {
		    if (self.word.length) {
			    var k = self.kw[self.word];
			    if (k) {
				    i+= k.call(code, i);
			    }
			    self.word = ''
		    }
	    }else if (c == '(') {
		    if (self.word.length)
			    i+= self.doFunc(self.word, code, i)
		    self.word = ''
	    }else if (c == '{') {
		    self.block = 1;
		    self.condblock++;
		    dlog('enter block') 
	    }else if (c == '}') {
		    self.block = 0;
		    dlog('leave block')
	    } else {
		    return -1;
	    }
	    return i;
    }

    self.parse = function () {
	    var n = 0;
	    var c = 0;
	    for(i = 0 ; i < self.code.length; i++) {
		    c = self.code[i];
		    if ( (n = self.parseOP(c, self.code, i)) > 0) {
			    i=n;
		    } else {
			    self.word += c;
		    }
	    };
    }
}

module.exports = JuluParser;
