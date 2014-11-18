package dk

import (
	log "github.com/Sirupsen/logrus"
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

// Validate (and complete with default values) a parsed configuration.
func (m Config) Validate() error {
	if m.Proxy.Listen == "" {
		m.Proxy.Listen = "127.0.0.1:3128"
	} else {
		log.WithField("ip", m.Proxy.Listen).
			Debug("config: found proxy listen")
	}

	return nil
}
