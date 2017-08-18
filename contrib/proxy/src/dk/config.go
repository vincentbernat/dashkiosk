package dk

import (
	"gopkg.in/gcfg.v1"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"
)

// Configuration for an URL
type UrlConfig struct {
	Allow_Framing        *bool
	Append_XForwardedFor *bool
	// HTTPS-related stuff
	Https             *bool
	Https_Verify_Cert *bool
	// Just to help testing
	Nothing bool
}

// Default configuration for an URL
var t = true
var f = false
var defaultUrlConfig = UrlConfig{
	Allow_Framing:        &t,
	Append_XForwardedFor: &t,
	Https:                &f,
	Https_Verify_Cert:    &t,
}

// General configuration.
type Config struct {
	Proxy struct {
		Listen string
		Debug  bool
		Syslog bool
	}
	Url map[string]*UrlConfig
}

// Parse a configuration file
func ParseConfigurationFile(configfile string) (*Config, error) {
	var cfg Config
	var err error
	log.Debug("parsing configuration file `%s'", configfile)
	err = gcfg.ReadFileInto(&cfg, configfile)
	if err != nil {
		log.Critical("unable to parse configuration: %s", err)
		return nil, err
	}
	err = cfg.validate()
	if err != nil {
		log.Critical("incorrect or incomplete configuration: %s", err)
		return nil, err
	}
	return &cfg, nil
}

// Validate (and complete with default values) a parsed configuration.
func (m *Config) validate() error {
	if m.Proxy.Listen == "" {
		m.Proxy.Listen = "127.0.0.1:3128"
	}

	return nil
}

// Get the correct configuration for an URL
func (m *Config) UrlConfiguration(url string) *UrlConfig {
	// We merge from the less specific to the more specific. We
	// assume specificity is an ordering identical the pattern
	// length.
	patterns := make([]string, len(m.Url))
	for p, _ := range m.Url {
		patterns = append(patterns, p)
	}
	sort.Strings(patterns)

	conf := defaultUrlConfig
	for _, p := range patterns {
		if !strMatch(url, p) {
			continue
		}
		log.Debug("url %v is matching configuration pattern %p",
			url, p)
		conf.merge(*m.Url[p])
	}
	return &conf
}

// Merge two URL configuration
func (u *UrlConfig) merge(src UrlConfig) {
	if src.Allow_Framing != nil {
		u.Allow_Framing = src.Allow_Framing
	}
	if src.Append_XForwardedFor != nil {
		u.Append_XForwardedFor = src.Append_XForwardedFor
	}
	if src.Https != nil {
		u.Https = src.Https
	}
	if src.Https_Verify_Cert != nil {
		u.Https_Verify_Cert = src.Https_Verify_Cert
	}
}

// Convert a string to be safe to use in a regular expression
func strToRegex(str string) string {
	var specials = "[]{}()<>*+^$?|\\.-"
	var N = utf8.RuneCountInString(specials)
	replacements := make([]string, N*2)
	for idx, special := range specials {
		replacements[idx*2] = string(special)
		replacements[idx*2+1] = "\\" + string(special)
	}
	replacer := strings.NewReplacer(replacements...)
	return replacer.Replace(str)
}

// Glob matching. Much like `filepath.Match' but doesn't assume we are
// working on filenames. We assume to only support `.' and `*'. No
// escapes.
func strMatch(str string, pattern string) bool {
	replacer := strings.NewReplacer("\\*", ".*", "\\?", ".")
	regex := fmt.Sprintf("^%s$",
		replacer.Replace(strToRegex(pattern)))
	matched, err := regexp.MatchString(regex, str)
	return err == nil && matched
}
