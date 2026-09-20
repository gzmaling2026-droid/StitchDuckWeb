#!/usr/bin/env python3
"""Build the published pages from the multilingual sources in _src/pages/.

A source page carries every language side by side:

  text        <span class="l-en">…</span><span class="l-zh">…</span><span class="l-zht">…</span> … one per language
  attributes  <img data-en-alt="…" data-zh-alt="…" … >   ->   <img alt="…">

A piece of copy that lacks a language stops the build.

and may use these tokens:

  {{home}}           root of the current language: /, /zh-hans/ or /zh-hant/
  {{appstore}}       App Store link for the current language
  {{shots}}          screenshot folder for the current language
  {{lang_label}}     name of the current language
  <!--seo-->         canonical, hreflang, Open Graph and JSON-LD for the page
  <!--lang-menu-->   links to the same page in every language
  <!--lang-links-->  the same links as one line of plain text
  <!--include:x-->   the shared fragment _src/partials/x.html (the header and the footer)
  {{active:path}}    marks the header link of the page being built

Output is one page per language — / for English, which is also the x-default,
and /zh-hans/, /zh-hant/, /de/, /es/, /fr/, /ja/, /ru/ — plus sitemap.xml. The
languages and their order follow the app. Only the standard library is needed.

  python3 _src/build.py           build
  python3 _src/build.py --check   exit 1 if the published files are out of date
"""

import hashlib
import html
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import NamedTuple

SITE = 'https://stitchduckapp.com'
APP_ID = '6797516970'
ROOT = Path(__file__).resolve().parent.parent
PAGES_DIR = ROOT / '_src' / 'pages'
PARTIALS_DIR = ROOT / '_src' / 'partials'

ORG_NAME = 'Guangzhou Maling Information Technology Co., Ltd.'
ORG_EMAIL = 'stitchduckapp@icloud.com'
APP_LANGUAGES = ['en', 'zh-Hans', 'zh-Hant', 'de', 'es', 'fr', 'ja', 'ru']


class Lang(NamedTuple):
    key: str        # l-<key> classes and data-<key>-* attributes in the sources
    prefix: str     # URL prefix below the site root
    tag: str        # <html lang> and hreflang
    og_locale: str
    label: str
    site_name: str
    app_name: str
    appstore: str
    shots: str
    og_image: str


# Region-less App Store links send visitors in mainland China to the storefront
# home page rather than the app, so the Simplified Chinese pages name the
# China storefront outright.
LANGS = (
    Lang('en', '', 'en', 'en_US', 'English', 'StitchDuck', 'StitchDuck',
         f'https://apps.apple.com/app/id{APP_ID}', '/assets/shots/en', '/assets/og/og-en.jpg'),
    Lang('zh', 'zh-hans/', 'zh-Hans', 'zh_CN', '简体中文', '绣鸭 StitchDuck', '绣鸭',
         f'https://apps.apple.com/cn/app/id{APP_ID}', '/assets/shots/zh-hans', '/assets/og/og-zh-hans.jpg'),
    Lang('zht', 'zh-hant/', 'zh-Hant', 'zh_TW', '繁體中文', 'StitchDuck', 'StitchDuck',
         f'https://apps.apple.com/app/id{APP_ID}', '/assets/shots/en', '/assets/og/og-zh-hant.jpg'),
) + tuple(
    Lang(key, f'{key}/', key, og_locale, label, 'StitchDuck', 'StitchDuck',
         f'https://apps.apple.com/app/id{APP_ID}', '/assets/shots/en', f'/assets/og/og-{key}.jpg')
    for key, og_locale, label in (('de', 'de_DE', 'Deutsch'), ('es', 'es_ES', 'Español'), ('fr', 'fr_FR', 'Français'),
                                  ('ja', 'ja_JP', '日本語'), ('ru', 'ru_RU', 'Русский'))
)
DEFAULT = LANGS[0]
KEYS = '|'.join(l.key for l in LANGS)

# Page paths below each language root, and whether the page invites an install.
PAGES = (('', True), ('support/', True), ('privacy/', False))


class BuildError(Exception):
    pass


# ---------- language selection ----------

SPAN = re.compile(r'<span\b[^>]*>|</span\s*>', re.I)
L_SPAN = re.compile(rf'<span class="l-({KEYS})">')
L_CLASS = re.compile(rf'class="[^"]*\bl-(?:{KEYS})\b')
L_ATTR = re.compile(rf'\s+data-({KEYS})-([a-z][a-z-]*)="([^"]*)"')
TAG = re.compile(r'<[a-zA-Z][^<>]*>')
INCLUDE = re.compile(r'<!--include:([a-z-]+)-->')
ACTIVE = re.compile(r'\{\{active:([^}]*)\}\}')


def language_spans(src, where):
    """(start, end, inner start, inner end, key) of every l-<key> span, in document order."""
    found, stack = [], []
    for m in SPAN.finditer(src):
        tag = m.group(0)
        if tag[1] == '/':
            if not stack:
                raise BuildError(f'{where}: </span> without an opening tag')
            key, start, inner = stack.pop()
            if key:
                found.append((start, m.end(), inner, m.start(), key))
            continue
        lm = L_SPAN.fullmatch(tag)
        if not lm and L_CLASS.search(tag):
            raise BuildError(f'{where}: write language spans exactly as <span class="l-xx">, got {tag}')
        if lm and any(key for key, _, _ in stack):
            raise BuildError(f'{where}: language spans must not nest, near {src[m.start():m.start() + 60]!r}')
        stack.append((lm.group(1) if lm else None, m.start(), m.end()))
    if stack:
        raise BuildError(f'{where}: unclosed <span>')
    found.sort()
    check_groups(src, found, where)
    return found


def check_groups(src, spans, where):
    """Adjacent language spans form one piece of copy; each piece needs every language once."""
    def verify(group):
        keys = sorted(s[4] for s in group)
        if keys != sorted(l.key for l in LANGS):
            line = src.count('\n', 0, group[0][0]) + 1
            missing = sorted({l.key for l in LANGS} - set(keys))
            raise BuildError(f'{where}, line {line}: has {keys}, missing {missing}')

    group = []
    for span in spans:
        apart = group and src[group[-1][1]:span[0]].strip()
        if group and (apart or span[4] in {s[4] for s in group}):
            verify(group)
            group = []
        group.append(span)
    if group:
        verify(group)


def pick_text(src, key, where):
    """Keep the contents of the l-<key> spans, drop the other languages' spans."""
    out, pos = [], 0
    for start, end, inner_start, inner_end, span_key in language_spans(src, where):
        before = src[pos:start]
        if span_key == key:
            out += [before, src[inner_start:inner_end]]
        else:
            # A dropped span on a line of its own takes the line with it.
            out.append(re.sub(r'\n[ \t]*$', '', before))
        pos = end
    out.append(src[pos:])
    return ''.join(out)


def pick_attrs(src, key, where):
    """Turn data-<key>-name="…" into name="…" and drop the other languages' copies."""
    def fix(m):
        tag = m.group(0)
        names = {a.group(2) for a in L_ATTR.finditer(tag)}
        for name in names:
            if not re.search(rf'\sdata-{key}-{name}="', tag):
                raise BuildError(f'{where}: data-{key}-{name} is missing in {tag[:80]}…')
        return L_ATTR.sub(lambda a: f' {a.group(2)}="{a.group(3)}"' if a.group(1) == key else '', tag)
    return TAG.sub(fix, src)


# ---------- generated fragments ----------

def url(lang, page):
    return f'/{lang.prefix}{page}'


def lang_links(lang, page, separator):
    links = []
    for l in LANGS:
        current = ' aria-current="page"' if l is lang else ''
        links.append(f'<a href="{url(l, page)}" lang="{l.tag}" hreflang="{l.tag}" '
                     f'data-setlang="{l.key}"{current}>{l.label}</a>')
    return separator.join(links)


def text_of(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', fragment))).strip()


def json_ld(data):
    body = json.dumps(data, ensure_ascii=False, indent=2).replace('</', '<\\/')
    return f'<script type="application/ld+json">\n{body}\n</script>'


def app_schema(lang, page_html, canonical, description):
    org_id, site_id = f'{SITE}/#organization', f'{SITE}/#website'
    app = {
        '@type': 'SoftwareApplication',
        '@id': f'{SITE}/#app',
        'name': lang.app_name,
        'alternateName': sorted({'StitchDuck', '绣鸭', 'StitchDuck: Cross Stitch Maker'} - {lang.app_name}),
        'description': description,
        'url': canonical,
        'image': SITE + lang.og_image,
        'applicationCategory': 'DesignApplication',
        'operatingSystem': 'iOS, iPadOS, macOS',
        'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
        'downloadUrl': lang.appstore,
        'inLanguage': APP_LANGUAGES,
        'author': {'@id': org_id},
        'publisher': {'@id': org_id},
    }
    shots = re.findall(r'(/assets/shots/[^\s",]+)\s+1366w', page_html)
    if shots:
        app['screenshot'] = [SITE + s for s in dict.fromkeys(shots)]
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {'@type': 'Organization', '@id': org_id, 'name': ORG_NAME, 'url': f'{SITE}/',
             'logo': f'{SITE}/assets/apple-touch-icon.png', 'email': ORG_EMAIL},
            {'@type': 'WebSite', '@id': site_id, 'url': f'{SITE}/', 'name': 'StitchDuck',
             'alternateName': '绣鸭', 'inLanguage': [l.tag for l in LANGS], 'publisher': {'@id': org_id}},
            app,
        ],
    }


def faq_schema(lang, page_html):
    items = re.findall(r'<details>\s*<summary>(.*?)</summary>(.*?)</details>', page_html, re.S)
    if not items:
        return None
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'inLanguage': lang.tag,
        'mainEntity': [{'@type': 'Question', 'name': text_of(q),
                        'acceptedAnswer': {'@type': 'Answer', 'text': text_of(a)}} for q, a in items],
    }


def seo_block(lang, page, invites_install, page_html, where):
    title = re.search(r'<title>(.*?)</title>', page_html, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', page_html)
    if not title or not desc:
        raise BuildError(f'{where}: needs a <title> and a meta description')
    title, desc = text_of(title.group(1)), html.unescape(desc.group(1))
    canonical = SITE + url(lang, page)
    esc = lambda s: html.escape(s, quote=True)

    lines = [f'<link rel="canonical" href="{canonical}">']
    lines += [f'<link rel="alternate" hreflang="{l.tag}" href="{SITE}{url(l, page)}">' for l in LANGS]
    lines += [f'<link rel="alternate" hreflang="x-default" href="{SITE}{url(DEFAULT, page)}">']
    lines += [
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{esc(lang.site_name)}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(desc)}">',
        f'<meta property="og:url" content="{canonical}">',
        f'<meta property="og:image" content="{SITE}{lang.og_image}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:locale" content="{lang.og_locale}">',
    ]
    lines += [f'<meta property="og:locale:alternate" content="{l.og_locale}">' for l in LANGS if l is not lang]
    lines += ['<meta name="twitter:card" content="summary_large_image">']
    if invites_install:
        lines += [f'<meta name="apple-itunes-app" content="app-id={APP_ID}">']
    if page == '':
        lines += [json_ld(app_schema(lang, page_html, canonical, desc))]
    faq = faq_schema(lang, page_html)
    if faq:
        lines += [json_ld(faq)]
    return '\n'.join(lines)


# ---------- page assembly ----------

def asset_version(m):
    path = ROOT / m.group(1).lstrip('/')
    if not path.is_file():
        raise BuildError(f'missing asset {m.group(1)}')
    return f'{m.group(1)}?v={hashlib.sha1(path.read_bytes()).hexdigest()[:8]}'


def build_page(src_path, lang, page, invites_install):
    where = f'{src_path.relative_to(ROOT)} [{lang.key}]'
    src = INCLUDE.sub(lambda m: (PARTIALS_DIR / f'{m.group(1)}.html').read_text(encoding='utf-8').rstrip('\n'),
                      src_path.read_text(encoding='utf-8'))
    out = pick_attrs(pick_text(src, lang.key, where), lang.key, where)
    out = ACTIVE.sub(lambda m: ' class="active"' if m.group(1) == page else '', out)

    html_tag = f'<html lang="{lang.tag}" data-lang="{lang.key}"'
    if lang is DEFAULT:
        # lang.js sends a visitor who chose another language to these.
        html_tag += ''.join(f' data-alt-{l.key}="{url(l, page)}"' for l in LANGS if l is not lang)
    out, n = re.subn(r'<html\b[^>]*>', html_tag + '>', out, count=1)
    if n != 1:
        raise BuildError(f'{where}: no <html> tag')

    for token, value in (('{{home}}', url(lang, '')), ('{{appstore}}', lang.appstore),
                         ('{{shots}}', lang.shots), ('{{lang_label}}', lang.label),
                         ('<!--lang-menu-->', lang_links(lang, page, '\n          ')),
                         ('<!--lang-links-->', lang_links(lang, page, ' · '))):
        out = out.replace(token, value)
    out = out.replace('<!--seo-->', seo_block(lang, page, invites_install, out, where))
    out = re.sub(r'(/assets/[\w./-]+\.(?:css|js))(?=")', asset_version, out)

    banner = f'<!-- Generated from {src_path.relative_to(ROOT)} by _src/build.py. Edit the source, then rebuild. -->'
    out = out.replace('<!DOCTYPE html>\n', f'<!DOCTYPE html>\n{banner}\n', 1)

    left = re.search(rf'{{{{|<!--(?:seo|lang-)|\bl-(?:{KEYS})"|\sdata-(?:{KEYS})-', out)
    if left:
        raise BuildError(f'{where}: unresolved "{left.group(0)}" in the output')
    return out


def last_modified(src_path):
    """Date of the last commit to the page source or a shared fragment; today if any has uncommitted edits."""
    paths = [str(src_path)] + sorted(str(p) for p in PARTIALS_DIR.glob('*.html'))
    try:
        git = lambda *args: subprocess.run(('git',) + args + ('--',) + tuple(paths), cwd=ROOT,
                                           capture_output=True, text=True).stdout.strip()
        if not git('status', '--porcelain'):
            return git('log', '-1', '--format=%cs') or date.today().isoformat()
    except OSError:
        pass
    return date.today().isoformat()


def build_sitemap():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
             'xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for page, _ in PAGES:
        modified = last_modified(PAGES_DIR / page / 'index.html')
        for lang in LANGS:
            lines.append('  <url>')
            lines.append(f'    <loc>{SITE}{url(lang, page)}</loc>')
            for l in LANGS:
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{l.tag}" href="{SITE}{url(l, page)}"/>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{url(DEFAULT, page)}"/>')
            lines.append(f'    <lastmod>{modified}</lastmod>')
            lines.append('  </url>')
    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'


def main():
    check = '--check' in sys.argv[1:]
    outputs = {}
    for page, invites_install in PAGES:
        src_path = PAGES_DIR / page / 'index.html'
        for lang in LANGS:
            outputs[ROOT / lang.prefix / page / 'index.html'] = build_page(src_path, lang, page, invites_install)
    outputs[ROOT / 'sitemap.xml'] = build_sitemap()

    stale = [p for p, text in outputs.items()
             if not p.is_file() or p.read_text(encoding='utf-8') != text]
    if check:
        for p in stale:
            print(f'out of date: {p.relative_to(ROOT)}')
        return 1 if stale else 0
    for p in stale:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(outputs[p], encoding='utf-8')
        print(f'wrote {p.relative_to(ROOT)}')
    print(f'{len(outputs)} files, {len(stale)} updated')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except BuildError as e:
        sys.exit(f'build failed: {e}')
