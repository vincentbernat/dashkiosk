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
	c.Assert(len(cfg.Url), Equals, 9)
	c.Assert(cfg.Url["http://*/nothing/*"].Allow_Framing, IsNil)
	c.Assert(cfg.Url["http://*/nothing/*"].Append_XForwardedFor, IsNil)
	c.Assert(cfg.Url["http://*/nothing/*"].Https, IsNil)
	c.Assert(cfg.Url["http://*/nothing/*"].Https_Verify_Cert, IsNil)
	c.Assert(*cfg.Url["http://*/*allow-framing"].Allow_Framing, Equals, true)
	c.Assert(*cfg.Url["http://*/no-allow-framing"].Allow_Framing, Equals, false)
	c.Assert(*cfg.Url["http://*/*x-forwarded-for"].Append_XForwardedFor, Equals, true)
	c.Assert(*cfg.Url["http://*/no-x-forwarded-for"].Append_XForwardedFor, Equals, false)
	c.Assert(*cfg.Url["http://*/*https"].Https, Equals, true)
	c.Assert(*cfg.Url["http://*/no-https"].Https, Equals, false)
	c.Assert(*cfg.Url["http://*/*https-verify-cert*"].Https_Verify_Cert, Equals, true)
	c.Assert(*cfg.Url["http://*/no-https-verify-cert*"].Https_Verify_Cert, Equals, false)
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
	// HTTPS
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/https").Https,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/no-https").Https,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.net/nothing/no-https").Https,
		Equals, false)
	// HTTPS certificate verification
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/https-verify-cert").Https_Verify_Cert,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/no-https-verify-cert").Https_Verify_Cert,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.net/nothing/no-https-verify-cert").Https_Verify_Cert,
		Equals, false)
	// Default value
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Allow_Framing,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Append_XForwardedFor,
		Equals, true)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Https,
		Equals, false)
	c.Assert(*cfg.UrlConfiguration("http://www.example.com/nothing/").Https_Verify_Cert,
		Equals, true)
}
