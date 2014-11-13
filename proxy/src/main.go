package main

import "dk"
import (
	"code.google.com/p/gcfg"
	log "github.com/Sirupsen/logrus"
	"gopkg.in/alecthomas/kingpin.v1"
	"os"
)

var version string

func main() {
	/* Setup initial logging */
	log.SetOutput(os.Stderr)
	log.SetLevel(log.WarnLevel)

	/* Parse command line arguments */
	debug := kingpin.
		Flag("debug", "more verbose output").
		Bool()
	configfile := kingpin.
		Arg("configuration", "configuration file").
		Required().
		ExistingFile()
	kingpin.Version(version)
	kingpin.Parse()
	if *debug {
		log.SetLevel(log.DebugLevel)
	}

	/* Parse and validate configuration file */
	var cfg dk.Config
	var err error
	log.WithField("file", *configfile).
		Debug("main: parsing configuration file")
	err = gcfg.ReadFileInto(&cfg, *configfile)
	if err != nil {
		log.WithField("error", err).
			Fatal("main: unable to parse configuration")
	}
	err = cfg.Validate()
	if err != nil {
		log.WithField("error", err).
			Fatal("main: incorrect or incomplete configuration")
	}
	if *debug {
		cfg.Proxy.Debug = true
	}

	/* Start proxy */
	err = dk.Proxy(cfg)
	if err != nil {
		log.WithField("error", err).
			Fatal("main: proxy stopped")
	}
}
