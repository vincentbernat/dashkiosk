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
	Server *httptest.Server
	Proxy  *httptest.Server
	Client *http.Client
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
	if s.Proxy != nil {
		s.Proxy.Close()
	}
}

func (s *ProxySuite) get(url string) (*http.Response, []byte, error) {
	resp, err := s.Client.Get(s.Server.URL + url)
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
