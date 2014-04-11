# -*- coding: utf-8 -*-

import sys
import os
import json

extensions = ['sphinxcontrib.httpdomain']
templates_path = ['_templates']
source_suffix = '.rst'
master_doc = 'index'

# General information about the project.
project = u'Dashkiosk'
copyright = u'2014, Vincent Bernat'
version = json.load(file('../package.json'))['version']
release = version

exclude_patterns = ['_build']
pygments_style = 'sphinx'
html_theme = 'default'

html_logo = "../app/images/dashkiosk.svg"
html_favicon = "../app/images/favicon.ico"
html_static_path = ['_static']
htmlhelp_basename = 'Dashkioskdoc'
