package dk

import (
	"fmt"
	"github.com/elazarl/goproxy"
	"net/http"
)

func NewProxy(cfg Config) (*goproxy.ProxyHttpServer, error) {
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = cfg.Proxy.Debug
	log.Info("start serving requests on %s", cfg.Proxy.Listen)

	// Register configuration inside context
	proxy.OnRequest().
		DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		url := fmt.Sprintf("%s://%s%s",
			req.URL.Scheme, req.URL.Host, req.URL.Path)
		ctx.UserData = cfg.UrlConfiguration(url)
		return req, nil
	})

	// Remove X-Frame-Options header
	proxy.OnResponse().
		DoFunc(func(resp *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
		allowed := ctx.UserData.(*UrlConfig).Allow_Framing
		if allowed != nil && *allowed {
			resp.Header.Del("X-Frame-Options")
		}
		return resp
	})
	return proxy, nil
}

func RunProxy(cfg Config) error {
	proxy, err := NewProxy(cfg)
	if err != nil {
		return err
	}
	return http.ListenAndServe(cfg.Proxy.Listen, proxy)
}
