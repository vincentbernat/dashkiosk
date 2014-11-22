package dk

import (
	"code.google.com/p/gcfg"
	"path/filepath"
	"sort"
)

// Configuration for an URL
type UrlConfig struct {
	Allow_Framing *bool
	Nothing       bool // Temporary
}

// Default configuration for an URL
var t = true
var defaultUrlConfig = UrlConfig{
	Allow_Framing: &t,
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
	err = cfg.Validate()
	if err != nil {
		log.Critical("incorrect or incomplete configuration: %s", err)
		return nil, err
	}
	return &cfg, nil
}

// Validate (and complete with default values) a parsed configuration.
func (m *Config) Validate() error {
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
		matched, err := filepath.Match(p, url)
		if err != nil {
			log.Warning("pattern matching with %v did fail: %s",
				p, err)
			continue
		}
		if !matched {
			continue
		}
		log.Debug("url %v is matching configuration pattern %p",
			url, p)
		conf.Merge(*m.Url[p])
	}
	return &conf
}

// Merge two URL configuration
func (u *UrlConfig) Merge(src UrlConfig) {
	if src.Allow_Framing != nil {
		u.Allow_Framing = src.Allow_Framing
	}
}
