package dk

import (
	"code.google.com/p/gcfg"
)

type Config struct {
	Proxy struct {
		Listen string
		Debug  bool
		Syslog bool
	}
	Url map[string]*struct {
		To_Https bool
	}
}

// Parse a configuration file
func ParseConfigurationFile(configfile string) (*Config, error) {
	var cfg Config
	var err error
	log.Debug("parsing configuration file `%s'", configfile)
	err = gcfg.ReadFileInto(&cfg, configfile)
	if err != nil {
		log.Critical("unable to parse configuration")
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
