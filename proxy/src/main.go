package main

import (
	"flag"
	"github.com/elazarl/goproxy"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

func main() {
	verbose := flag.Bool("v", false, "should every proxy request be logged to stdout")
	addr := flag.String("addr", ":8080", "proxy listen address")
	https := flag.String("https", "", "comma-separated list of domains that should be queried with TLS")
	flag.Parse()

	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = *verbose
	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		host := strings.SplitN(req.URL.Host, ":", 2)[0]
		for _, domain := range strings.Split(*https, ",") {
			m, _ := filepath.Match(domain, host)
			if m {
				req.URL.Scheme = "https"
				break
			}
		}
		return req, nil
	})
	log.Fatal(http.ListenAndServe(*addr, proxy))
}
