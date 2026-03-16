#!/bin/sh
set -eu

default_language="${DEFAULT_LANGUAGE:-en}"

case "$default_language" in
  en|it|es|fr|de) ;;
  *) default_language="en" ;;
esac

cat > /usr/share/nginx/html/default-language.js <<EOF
window.__DEFAULT_LANGUAGE__ = '${default_language}';
EOF
