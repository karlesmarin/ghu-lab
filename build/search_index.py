"""Canonical URLs shared by generated HTML and the root sitemap."""
import re
BASE='https://karlesmarin.github.io/ghu-explorer/'
# Ownership challenges are raw files, not searchable content pages.
VERIFICATION_FILES = ('google187af701b0e7661c.html',)
def current_page(rel):
    return rel not in VERIFICATION_FILES and rel.endswith('.html') and not rel.startswith('tools-') and (not rel.startswith('editions/') or rel=='editions/index.html') and (not rel.startswith('video/') or rel=='video/index.html')
def canonical(rel):return BASE+('' if rel=='index.html' else rel)
def metadata(rel,text):
    if not current_page(rel):return text
    expected='<link rel="canonical" href="'+canonical(rel)+'">'
    existing=re.findall(r'<link\s+rel="canonical"[^>]*>',text)
    if existing:
        if existing!=[expected]:raise ValueError('Conflicting canonical URL: '+rel)
        return text
    return text.replace('</head>',expected+'\n</head>',1)
