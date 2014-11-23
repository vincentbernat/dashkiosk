package dk

import (
	"crypto/tls"
	"fmt"
	"github.com/elazarl/goproxy"
	"net/http"
	"net/url"
	"strings"
)

func NewProxy(cfg Config) (*goproxy.ProxyHttpServer, error) {
	proxy := goproxy.NewProxyHttpServer()

	// Use two transports, one secure (certificate checks are
	// done) and one insecure.
	secureTransport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: false}}
	insecureTransport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}

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
		if resp != nil {
			allowed := ctx.UserData.(*UrlConfig).Allow_Framing
			if allowed != nil && *allowed {
				resp.Header.Del("X-Frame-Options")
			}
		}
		return resp
	})

	// Add X-Forwarded-For header
	proxy.OnRequest().
		DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		x := ctx.UserData.(*UrlConfig).Append_XForwardedFor
		if x != nil && *x {
			src := strings.Split(ctx.Req.RemoteAddr, ":")[0]
			req.Header.Set("X-Forwarded-For", src)
		}
		return req, nil
	})

	// Make the request over HTTPS
	proxy.OnRequest().
		DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		ssl := ctx.UserData.(*UrlConfig).Https
		if ssl != nil && *ssl {
			// For tests, we also need to get the
			// appropriate port for SSL. We expect to
			// found it in X-Test-HTTPS header.
			host := req.Header.Get("X-Test-HTTPS")
			if host != "" {
				req.URL.Host = host[8:]
			}
			req.URL.Scheme = "https"
		}
		return req, nil
	})

	// Convert back location to non-HTTP
	proxy.OnResponse().
		DoFunc(func(resp *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
		if resp == nil {
			return resp
		}
		location := resp.Header.Get("Location")
		if location == "" {
			return resp
		}
		// If the requested location would have been
		// redirected to HTTPS, give it back as an HTTP
		// location.
		url, err := url.Parse(location)
		if err != nil || url.Scheme != "https" {
			return resp
		}
		// For testing purposes, the address of the right server is in X-Test-HTTP header
		host := resp.Header.Get("X-Test-HTTP")
		if host != "" {
			host = host[7:]
		}
		ncfg := cfg.UrlConfiguration(
			fmt.Sprintf("http://%s%s",
				host, url.Path))
		if ncfg.Https != nil && *ncfg.Https {
			url.Scheme = "http"
			url.Host = host
			resp.Header.Set("Location", url.String())
		}

		return resp
	})

	// For HTTPS, do certificate checks
	proxy.OnRequest().
		DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		if req.URL.Scheme != "https" {
			return req, nil
		}
		verify := ctx.UserData.(*UrlConfig).Https_Verify_Cert
		ctx.RoundTripper = goproxy.RoundTripperFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Response, error) {
			if verify != nil && *verify {
				log.Debug("proxy: selecting secure transport for %v", req.URL)
				return secureTransport.RoundTrip(req)
			} else {
				log.Debug("proxy: selecting insecure transport for %v", req.URL)
				return insecureTransport.RoundTrip(req)
			}
		})

		return req, nil
	})

	// Log requests
	if cfg.Proxy.Debug {
		proxy.OnResponse().
			DoFunc(func(resp *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
			var status int
			if resp != nil {
				status = resp.StatusCode
			} else {
				status = 0
			}
			log.Debug("proxy: from %s: %d: %s %s %s",
				ctx.Req.RemoteAddr,
				status,
				ctx.Req.Method,
				ctx.Req.URL.String(),
				ctx.Req.Proto)
			return resp
		})
	}

	return proxy, nil
}

func RunProxy(cfg Config) error {
	proxy, err := NewProxy(cfg)
	if err != nil {
		return err
	}
	return http.ListenAndServe(cfg.Proxy.Listen, proxy)
}
