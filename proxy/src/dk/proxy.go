package dk

import (
	log "github.com/Sirupsen/logrus"
	"github.com/elazarl/goproxy"
	"net/http"
)

func Proxy(cfg Config) error {
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = cfg.Proxy.Debug
	log.WithField("listen", cfg.Proxy.Listen).
		Info("proxy: start serving requests")
	return http.ListenAndServe(cfg.Proxy.Listen, proxy)
}
