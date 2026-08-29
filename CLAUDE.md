# CLAUDE.md — Hash Brown Engineering website

## What this repo is

The public website for Hash Brown Engineering Limited, live at
<https://www.hashbrowneng.com>. It does two jobs:

1. **A company front page.** It carries the statutory details so the company
   has a website if anyone ever asks for one. This part should stay sober and
   accurate.
2. **A launchpad for experiments.** Its real purpose is to put small web tools
   and mini-projects — mostly written by Claude Code — somewhere public. The
   tools do not have to relate to the company's actual work.

Treat the tools as a hobby playground, but keep the front page presentable.

## Hard constraints

- **Static files only.** Hosting is GitHub Pages from `main`, repo root. There
  is no server, no build step, no package manager, no CI. A previous version of
  this site had an Express server and a PostgreSQL database; none of it could
  ever run here. Do not reintroduce a backend.
- **Never delete or edit `CNAME`.** It contains `www.hashbrowneng.com` and the
  custom domain breaks without it.
- **Keep `.nojekyll`.** It stops GitHub running Jekyll over the files, so what
  is committed is what is served.
- **No secrets in the repo.** Everything here is public. Anything needing an
  API key does not belong on this site.
- **No build tooling.** Prefer dependency-free vanilla JS. If a tool genuinely
  needs a library, load it from a CDN with an exact pinned version.

## Layout

```
/
├── index.html              Front page: masthead, tools index, company details
├── 404.html
├── CNAME                   Custom domain — do not touch
├── .nojekyll
├── robots.txt
├── sitemap.xml             Add a <url> entry per new tool
├── assets/
│   ├── style.css           Shared stylesheet for every page
│   └── favicon.svg
└── tools/
    ├── _template/          Starter page — copy this for a new tool
    └── unit-converter/     Each tool is one directory with an index.html
```

## Adding a new tool

Four steps. Do all four — a tool that is not linked from `index.html` is
invisible.

1. **Create the directory.** `tools/<kebab-case-name>/index.html`. Start from
   `tools/_template/index.html`. Self-contained is fine: put the tool's own CSS
   in a `<style>` block and its JS in a `<script>` block in that one file. Only
   split files out if the tool actually gets large.

2. **Link the shared stylesheet** with `/assets/style.css` and keep the
   `.tool-nav` back-link, the `.page` wrapper and the footer. That is what makes
   the tools feel like one site. The stylesheet already provides layout, type,
   form controls, focus styles and dark mode — use its tokens
   (`var(--ink)`, `var(--accent)`, `var(--rule)`, …) rather than hard-coded
   colours, or the tool will break in dark mode.

3. **Add it to the tools index** in `index.html`, newest first. Copy an
   existing `<li>` block:

   ```html
   <li>
       <a class="tool" href="/tools/<name>/">
           <span class="tool-name">Display Name</span>
           <span class="tool-go" aria-hidden="true">&rarr;</span>
           <span class="tool-desc">One sentence on what it does.</span>
       </a>
   </li>
   ```

4. **Add a `<url>` entry to `sitemap.xml`.**

## Conventions

- 4-space indentation in HTML, CSS and JS.
- kebab-case for file and directory names and for CSS classes.
- British English in prose (`colour` in copy, but `color` in CSS properties).
- Absolute paths from the site root (`/assets/style.css`), not relative ones —
  tools live one or two directories deep and relative paths break.
- Semantic HTML, real `<label>`s for form controls, `alt` text on images.
- Every page: `<title>`, `<meta name="description">`, the favicon link, and
  `lang="en-GB"`.

## Previewing locally

`file://` will not resolve the absolute `/assets/...` paths, so serve the
directory:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## The company details

The statutory block on `index.html` is real information about a real company.
Do not invent, reword or "improve" it. If it needs changing, check against the
[Companies House record](https://find-and-update.company-information.service.gov.uk/company/SC644189)
first.

| | |
|---|---|
| Registered name | Hash Brown Engineering Limited |
| Company number | SC644189 |
| VAT number | GB 334762592 |
| Registered office | 5 South Charlotte Street, Edinburgh, EH2 4AN, Scotland |
| Incorporated | 11 October 2019 |
| SIC | 71129 — Other engineering activities |
| Director | Colin McCrae — colin@hashbrowneng.com |
