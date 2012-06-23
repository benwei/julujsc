
function ast() {
	var tag;
	var op = {
	/* 
	binary tree
		oper
		left
		right

	unary
		oper
		uexp

	call
		name
		args
	*/
	};

};

var counter=0
var astenum = {
	int_exp: counter,
	binary_op: counter++,
	unary_op: counter++,
	function_call: counter++,
}


function OPFactory () {
	var that = {};
	that.ast = ast;
	that.astenum = astenum;
	that.make_binary_op = function (op, l, r) {
		var e = new that.ast();
		e.tag = astenum.binary_op;
		e.op = { oper: op, left: l, right: r}
		return e;
	}
	that.dumpast = function (ast, level) {
		if (level === 'undefined') {
			level = 0;
		} else {
			level++;
		}
		//console.log("tag:" + ast.tag);
		if (ast.tag == astenum.binary_op) {
			console.log("oper("+ ast.op.oper +")")
			console.log("l(" + ast.op.left + ")  r("+ ast.op.right +")")
			that.dumpast(ast.op.left, level);
			that.dumpast(ast.op.right, level);
		}
	}
	return that;
}


module.exports = OPFactory;
