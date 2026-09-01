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
│   ├── uk-tax.js           Shared UK tax rates and band arithmetic
│   └── favicon.svg
└── tools/
    ├── _template/          Starter page — copy this for a new tool
    └── unit-converter/     Each tool is one directory with an index.html
```

## Adding a new tool

Four steps. Do all four — a tool that is not linked from `index.html` is
invisible.

1. **Create the directory.** `tools/<kebab-case-name>/index.html`. Start from
   `tools/_template/index.html`, which is a working page rather than a skeleton:
   copy it, open it, and it renders and passes its own self-checks. Replace the
   reference data and the checks with yours. Self-contained is fine: put the
   tool's own CSS in a `<style>` block and its JS in a `<script>` block in that
   one file. Only split files out if the tool actually gets large.

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

## How the tools are built

The template encodes a pattern the existing tools all follow, and it is worth
keeping to:

1. **Reference data in one block**, with its source noted beside it.
2. **A derived engine** — nothing stored that can be computed, so a label can
   never disagree with the number next to it.
3. **Rendering that reads only from the engine.**
4. **Self-checks that run on load** and report into an "Assumptions & sources"
   panel at the foot of the page.

The self-checks are the part that matters. These pages are mostly constants,
which is exactly the kind of thing that looks right when it is wrong. Pin
figures worked out by hand *before* writing the code, so they test it rather
than restate it, and assert the relationships too — round trips, monotonicity,
things that must be equal and things that must not be. A failure is rendered
loudly on the page in red, which is better than a plausible wrong answer.

Each tool also states, in that same panel, what it assumes and what it does
**not** model. That section is the most useful one and the easiest to skip.

## The shared tax module

`/assets/uk-tax.js` holds the UK rate data and the band arithmetic, shared by
the tax tools. It defines one global, `UKTax`; load it with a plain
`<script src="/assets/uk-tax.js">` before the tool's own script.

- **Rates live there and nowhere else**, so a Budget is one edit in one file.
  Add a tax year to `YEARS`, add its id to `YEAR_ORDER`, then extend the pinned
  figures in each tool that uses the block you changed.
- **Income tax bands are held in taxable-income space**, which is how the
  statute defines them. The familiar gross figures are derived by
  `nonSavingsGross()`. Do not go the other way: adding the allowance back is
  only correct below the taper, and getting it backwards once printed the
  additional rate threshold as £137,710.
- **`ladder()` builds a progressive slice ladder** — the shape of SDLT, LBTT and
  LTT — and `amountAt()` / `rateAt()` then give tax due and marginal rate for
  free. A stamp duty tool needs no income tax machinery at all.
- **`incomeTaxPosition()` works out a whole income tax position** — where each
  slice of income sits and which nil-rate bands reach it — and
  `taxFromPosition()` charges it. `incomeTaxOn(year, region, other, savings,
  dividends)` is the two of them together when only the number is wanted. Take
  the position itself when a tool has to *label* the bands, so the label and the
  figure beside it come from the same object.
- **`corporationTax()` includes marginal relief**, and divides both limits by
  one plus the number of associated companies. The relief makes the rate on a
  pound inside the band higher than the main rate, not lower: 26.5% against 25%.
- **`checker()` is the self-check harness** and `pct(rate, decimalPlaces)` takes
  its precision explicitly, because the tools disagree about it.

A tool that plots a marginal rate against something the tax is not levied on —
company profit before the owner is paid, say — must find its kinks by walking
each threshold *back* through whatever the tool does to the money, not by
plotting the threshold where it appears in the rate table. A chart built as a
step function draws a flat line straight through a kink it was not told about,
which looks entirely plausible. Assert that the rate is flat between consecutive
kinks; that is what catches it.

Anything specific to one tool stays with that tool. The test for putting
something in the shared file is whether a second tool would want it.

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
