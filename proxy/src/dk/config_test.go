package dk

import (
	. "gopkg.in/check.v1"
	"testing"
)

// Hookup with go check
func Test(t *testing.T) { TestingT(t) }

type S struct{}

var _ = Suite(&S{})

// Test a simple configuration file
func (s *S) TestConfigSimple(c *C) {
	cfg, err := ParseConfigurationFile("testdata/simple.ini")
	c.Assert(err, IsNil)
	c.Assert(cfg.Proxy.Debug, Equals, true)
	c.Assert(cfg.Proxy.Syslog, Equals, true)
	c.Assert(cfg.Proxy.Listen, Equals, "127.0.0.1:3129")
}

// Test an empty configuration file
func (s *S) TestConfigEmpty(c *C) {
	cfg, err := ParseConfigurationFile("testdata/empty.ini")
	c.Assert(err, IsNil)
	c.Assert(cfg.Proxy.Debug, Equals, false)
	c.Assert(cfg.Proxy.Syslog, Equals, false)
	c.Assert(cfg.Proxy.Listen, Equals, "127.0.0.1:3128")
}

// Test a configuration file with unknown directives
func (s *S) TestConfigUnknown(c *C) {
	cfg, err := ParseConfigurationFile("testdata/errors.ini")
	c.Assert(err, NotNil)
	c.Assert(cfg, IsNil)
}

// Test a configuration files with several URL
func (s *S) TestConfigMultipleURL(c *C) {
	cfg, err := ParseConfigurationFile("testdata/urls.ini")
	c.Assert(err, IsNil)
	c.Assert(len(cfg.Url), Equals, 3)
	c.Assert(*cfg.Url["http://www.*"].Allow_Framing, Equals, false)
	c.Assert(cfg.Url["http://www.example.org*"].Allow_Framing, IsNil)
	c.Assert(*cfg.Url["http://www.example.com*"].Allow_Framing, Equals, true)
}

// Test merge of URL configuration
func (s *S) TestConfigUrlMatching(c *C) {
	cfg, err := ParseConfigurationFile("testdata/urls.ini")
	c.Assert(err, IsNil)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com").Allow_Framing,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.org").Allow_Framing,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.net").Allow_Framing,
		Equals, false)
	// Default value
	c.Assert(*cfg.UrlConfiguration("http://example.net").Allow_Framing,
		Equals, true)
}
