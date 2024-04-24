run:
	npm run --prefix web build
	go run . serve
build:
	go build -o build/strelavlna2 .
