def build [] {
  go build -C .. -v -o dist/strelavlna2 .
  ./strelavlna2 serve
}
