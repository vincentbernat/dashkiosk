package dk

import (
	. "gopkg.in/check.v1"
	"testing"
)

// Hookup with go check
func TestConfig(t *testing.T) { TestingT(t) }

type ConfigSuite struct{}

var _ = Suite(&ConfigSuite{})

// Test a simple configuration file
func (s *ConfigSuite) TestConfigSimple(c *C) {
	cfg, err := ParseConfigurationFile("testdata/simple.ini")
	c.Assert(err, IsNil)
	c.Assert(cfg.Proxy.Debug, Equals, true)
	c.Assert(cfg.Proxy.Syslog, Equals, true)
	c.Assert(cfg.Proxy.Listen, Equals, "127.0.0.1:3129")
}

// Test an empty configuration file
func (s *ConfigSuite) TestConfigEmpty(c *C) {
	cfg, err := ParseConfigurationFile("testdata/empty.ini")
	c.Assert(err, IsNil)
	c.Assert(cfg.Proxy.Debug, Equals, false)
	c.Assert(cfg.Proxy.Syslog, Equals, false)
	c.Assert(cfg.Proxy.Listen, Equals, "127.0.0.1:3128")
}

// Test a configuration file with unknown directives
func (s *ConfigSuite) TestConfigUnknown(c *C) {
	cfg, err := ParseConfigurationFile("testdata/errors.ini")
	c.Assert(err, NotNil)
	c.Assert(cfg, IsNil)
}

// Test a configuration files with several URL
func (s *ConfigSuite) TestConfigMultipleURL(c *C) {
	cfg, err := ParseConfigurationFile("testdata/urls.ini")
	c.Assert(err, IsNil)
	c.Assert(len(cfg.Url), Equals, 5)
	c.Assert(cfg.Url["http://*/nothing/*"].Allow_Framing, IsNil)
	c.Assert(cfg.Url["http://*/nothing/*"].Append_XForwardedFor, IsNil)
	c.Assert(*cfg.Url["http://*/*allow-framing"].Allow_Framing, Equals, true)
	c.Assert(*cfg.Url["http://*/no-allow-framing"].Allow_Framing, Equals, false)
	c.Assert(*cfg.Url["http://*/*x-forwarded-for"].Append_XForwardedFor, Equals, true)
	c.Assert(*cfg.Url["http://*/no-x-forwarded-for"].Append_XForwardedFor, Equals, false)
}

// Test merge of URL configuration
func (s *ConfigSuite) TestConfigUrlMatching(c *C) {
	cfg, err := ParseConfigurationFile("testdata/urls.ini")
	c.Assert(err, IsNil)
	// Framing
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/allow-framing").Allow_Framing,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/no-allow-framing").Allow_Framing,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.net/nothing/no-allow-framing").Allow_Framing,
		Equals, false)
	// X-Forwarded-For
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/x-forwarded-for").Append_XForwardedFor,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/no-x-forwarded-for").Append_XForwardedFor,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.net/nothing/no-x-forwarded-for").Append_XForwardedFor,
		Equals, false)
	// Default value
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Allow_Framing,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Append_XForwardedFor,
		Equals, true)
}
