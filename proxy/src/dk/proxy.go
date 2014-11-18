package dk

import (
	"github.com/elazarl/goproxy"
	"github.com/op/go-logging"
	"net/http"
)

var log = logging.MustGetLogger("dk-proxy")

func Proxy(cfg Config) error {
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = cfg.Proxy.Debug
	log.Info("start serving requests on %s", cfg.Proxy.Listen)
	return http.ListenAndServe(cfg.Proxy.Listen, proxy)
}
