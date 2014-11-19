package main

import "dk"
import (
	"github.com/op/go-logging"
	"gopkg.in/alecthomas/kingpin.v1"
	"log/syslog"
	"os"
)

var version string
var log = logging.MustGetLogger("dk-proxy")

func setupLogging(debug bool, toSyslog bool) {
	/* Logging to stderr */
	format := logging.MustStringFormatter(
		"[%{color:bold}%{level:.4s}%{color:reset}] %{time:2006-01-02T15:04:05Z-07:00} %{shortpkg}/%{shortfunc}: %{message}")
	stderr := logging.NewLogBackend(os.Stderr, "", 0)
	stderrFormatted := logging.NewBackendFormatter(stderr, format)
	stderrLeveled := logging.AddModuleLevel(stderrFormatted)
	stderrLeveled.SetLevel(logging.INFO, "")
	if debug {
		stderrLeveled.SetLevel(logging.DEBUG, "")
	}
	if toSyslog {
		sb, err := logging.NewSyslogBackendPriority(
			"dk-proxy", syslog.LOG_INFO|syslog.LOG_DAEMON)
		if err == nil {
			logging.SetBackend(stderrLeveled, sb)
			return
		}
	}
	logging.SetBackend(stderrLeveled)
}

func main() {
	/* Setup initial logging */
	setupLogging(true, false)

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

	/* Parse and validate configuration file */
	cfg, err := dk.ParseConfigurationFile(*configfile)
	if err != nil {
		os.Exit(1)
	}

	/* Logging */
	if *debug {
		cfg.Proxy.Debug = true
	}
	setupLogging(cfg.Proxy.Debug, cfg.Proxy.Syslog)

	/* Start proxy */
	err = dk.Proxy(*cfg)
	if err != nil {
		log.Fatal("proxy stopped")
	}
}
