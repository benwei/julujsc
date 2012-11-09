/**********************************
* JuluParser is a c-like parser
* command line interface
*
* (c) ben@staros.mobi (2012)
* License: MIT License
***********************************/

var util = require('util'),
fs = require('fs'),
JuluParser = require('../juluc/juluparser');

var verbose = 0;

function dlog(msg) {
	if (verbose)
		console.log(msg);
}

function puts(msg) {
	process.stdout.write(msg + "\n");
}

function syntax() {
	puts("syntax: [file]");
}

function error(err_msg)
{
	process.stderr.write(err_msg + '\n');	
}

function main() {
	if (process.argv.length < 2) {
		syntax();
		return 1;
	}

	var srcfile;
	for (var i = 2; i < process.argv.length; i++) {
		var arg = process.argv[i];
		if (arg[0] == '-') {
			if (arg[1] == 'v') {
				verbose++;
			} else {
				error('file not found: ' + srcfile);	
				return 2;
			}
		} else {
			srcfile = process.argv[i];
		}
	}

	dlog("run file: " + srcfile);

	if (!srcfile || !fs.existsSync(srcfile)) {
		error('file not found: ' + srcfile);	
		return 3;
	}

	var data = fs.readFileSync(srcfile);
	var code = data.toString().replace(/[\r\n]/g, ' ');
	dlog(code);
	var ip = new JuluParser(code.toString());
	ip.verbose = verbose;
	ip.parse();

	dlog("vars:" + util.inspect(ip.vars));
	dlog("stacks:" + util.inspect(ip.stacks));
	return ip.stacks[0];
}

process.exit(main());
