
tdds = tdd01_parser.js
tdds += tdd02_ast.js
all:
	@for tdd in $(tdds) ; do \
	echo "===<< run tests $$tdd >>===" ; \
	node $$tdd ; \
	done
