/**********************************
* JuluParser is a c-like parser
* test cases
*
* (c) ben@staros.mobi (2012)
* License: MIT License
***********************************/

var util = require('util'),
    JuluParser = require('../juluc/juluparser');

function testlog(msg) {
    console.log(msg)
}

function testcase(tid, data) {
    testlog("=======> case " + tid)
    var ip = new JuluParser(data)
    ip.verbose = 1;
    ip.parse()

    testlog("vars:" + util.inspect(ip.vars))
    testlog("stacks:" + util.inspect(ip.stacks))
    return ip.stacks[0]
}

function check_if(name, expr) {
    console.log("testcase:" + name + " --->" + (expr ? 'ok':'fail'))
}

function main () {
    test1="a=120 c=3 if (a eq 120)  { print(11) push(11) } else  { print(12) push(12) }"
    // 1: [ {'a': 120} , {'c': 3} ]
    // if (cond) { block1 } else { block2 }
 
    test2="a=4321 push(a)"
    test3="b=2+1+3-4 push(b)"
    test4="d=(4/2)*3 push(d)"
    test5="a=120 b=2+1+1-3 c=10/2*3 d=(4/2)*3 if (a eq 11)  { print(21) push(21) } else  { print(a) push(22) }"
    test6="func(a) { print(a) }  a=120 b=2+1+1-3 c=10/2*3 d=(4/2)*3 if (a eq 11)  { print(21) push(21) } else  { print(a) push(22) }"


    r = testcase(1, test1) 
    check_if('if condition true', r == 11)

    r = testcase(2, test2) 
    check_if('get Value', r == 4321)

    r = testcase(3, test3) 
    check_if('get Value', r == 2)

    r = testcase(4, test4) 
    check_if('get Value', r == 6)
    r = testcase(5, test5) 
    check_if('if condition false', r == 22)

    test7="a=101 push(a) pop(b) print(b) push(0)"
    r = testcase(7, test7)
    check_if('push/pop condition', r == '0')

    test8="a=102 push(a) push(100) push(0) pop() pop(b) print(b)"
    r = testcase(8, test8)
    check_if('push/pop condition', r == 102)
}

main()
