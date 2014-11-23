package dk

import (
	"crypto/tls"
	"fmt"
	. "gopkg.in/check.v1"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

// Hookup with go check
func TestProxy(t *testing.T) { TestingT(t) }

type ProxySuite struct {
	Server    *httptest.Server
	ServerTLS *httptest.Server
	Proxy     *httptest.Server
	Client    *http.Client
}

var _ = Suite(&ProxySuite{})

func (s *ProxySuite) SetUpTest(c *C) {
	cfg, err := ParseConfigurationFile("testdata/urls.ini")
	c.Assert(err, IsNil)
	proxy, err := NewProxy(*cfg)
	c.Assert(err, IsNil)

	s.Proxy = httptest.NewServer(proxy)
	proxyUrl, _ := url.Parse(s.Proxy.URL)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		Proxy:           http.ProxyURL(proxyUrl)}
	s.Client = &http.Client{Transport: tr}
}

func (s *ProxySuite) TearDownTest(c *C) {
	if s.Server != nil {
		s.Server.Close()
	}
	if s.ServerTLS != nil {
		s.ServerTLS.Close()
	}
	if s.Proxy != nil {
		s.Proxy.Close()
	}
}

func (s *ProxySuite) get(url string) (*http.Response, []byte, error) {
	req, err := http.NewRequest("GET", s.Server.URL+url, nil)
	if err != nil {
		return nil, nil, err
	}
	if s.ServerTLS != nil {
		req.Header.Add("X-Test-HTTPS", s.ServerTLS.URL)
	}
	resp, err := s.Client.Do(req)
	if err != nil {
		return resp, nil, err
	}
	txt, err := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if err != nil {
		return resp, nil, err
	}
	return resp, txt, nil
}

func (s *ProxySuite) TestSimpleRequest(c *C) {
	m := http.NewServeMux()
	m.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "hello!")
	})
	s.Server = httptest.NewServer(m)
	_, body, err := s.get("/hello")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "hello!")
}

func (s *ProxySuite) TestAllowFraming(c *C) {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		fmt.Fprintf(w, "hello!")
	})
	s.Server = httptest.NewServer(m)

	// Default
	resp, _, err := s.get("/hello")
	c.Assert(err, IsNil)
	c.Assert(resp.Header.Get("X-Frame-Options"), Equals, "")

	// Not stripped
	resp, _, err = s.get("/no-allow-framing")
	c.Assert(err, IsNil)
	c.Assert(resp.Header.Get("X-Frame-Options"), Equals, "SAMEORIGIN")

	// Stripped
	resp, _, err = s.get("/allow-framing")
	c.Assert(err, IsNil)
	c.Assert(resp.Header.Get("X-Frame-Options"), Equals, "")
}

func (s *ProxySuite) TestXForwardedFor(c *C) {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "%s", r.Header.Get("X-Forwarded-For"))
	})
	s.Server = httptest.NewServer(m)

	// Default
	_, body, err := s.get("/hello")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "127.0.0.1")

	// No XFF
	_, body, err = s.get("/no-x-forwarded-for")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "")

	// XFF
	_, body, err = s.get("/x-forwarded-for")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "127.0.0.1")
}

func (s *ProxySuite) TestHttps(c *C) {
	m1 := http.NewServeMux()
	m1.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "No SSL")
	})
	m2 := http.NewServeMux()
	m2.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "SSL")
	})
	m2.HandleFunc("/redirect/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Location", s.ServerTLS.URL+"/https")
		w.Header().Set("X-Test-HTTP", s.Server.URL)
		fmt.Fprintf(w, "Follow redirect SSL")
	})
	s.Server = httptest.NewServer(m1)
	s.ServerTLS = httptest.NewTLSServer(m2)

	// Default
	_, body, err := s.get("/hello")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "No SSL")

	// No SSL
	_, body, err = s.get("/no-https")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "No SSL")

	// SSL
	_, body, err = s.get("/https")
	c.Assert(err, IsNil)
	c.Assert(string(body), Equals, "SSL")

	// SSL with redirect to SSL
	resp, _, err := s.get("/redirect/https")
	c.Assert(err, IsNil)
	c.Assert(resp.Header.Get("Location"), Equals, s.Server.URL+"/https")
}
