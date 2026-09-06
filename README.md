# hashbrowneng.com

The website for **Hash Brown Engineering Limited** — live at
<https://www.hashbrowneng.com>.

It is a plain static site with two jobs: a sober front page carrying the
company's statutory details, and an index of small web tools and experiments
that grows over time.

## Tools

Newest first, as on the front page.

| Tool | What it does |
|---|---|
| [UK Inheritance Tax](https://www.hashbrowneng.com/tools/uk-inheritance-tax/) | Four estates against the 40% charge — the 60% band where the residence allowance tapers away above £2m, the April 2026 cap on farm and business relief, and the charitable legacy that can leave the heirs better off. |
| [Corporation Tax & Owner Extraction](https://www.hashbrowneng.com/tools/uk-corporation-tax/) | Corporation tax with its 26.5% marginal relief band, and what it costs to get profit out as salary, dividends, retained profit or a pension. |
| [UK Stamp Duty on Property](https://www.hashbrowneng.com/tools/uk-stamp-duty/) | SDLT, LBTT and LTT side by side for every buyer type, with the marginal rates and the cliff edges. |
| [Pipe Schedules](https://www.hashbrowneng.com/tools/pipe-schedules/) | Outside diameter, wall, bore, weight and capacity for every nominal size and schedule to ASME B36.10M and B36.19M. |
| [UK Tax on Savings, Dividends & Gains](https://www.hashbrowneng.com/tools/uk-investment-tax/) | What the next pound of interest, dividend or capital gain is taxed at once it is stacked on other income, including the personal savings allowance cliff. |
| [UK Tax & Take-Home Pay](https://www.hashbrowneng.com/tools/uk-tax-rates/) | Marginal rates, effective rates and take-home pay for UK employees, England/Wales/NI against Scotland, including Universal Credit, student loans and the £100,000 childcare cliff. |
| [Unit Converter](https://www.hashbrowneng.com/tools/unit-converter/) | 27 quantities and 165 units from process and flow assurance work, every unit shown at once, with the assumptions spelled out. |

The tax tools cover 2025/26 and 2026/27 and share their rates through
`assets/uk-tax.js`.

## How it is built

Static HTML, CSS and vanilla JavaScript. No build step, no dependencies, no
server. Hosted on GitHub Pages from the `main` branch, repo root, on a custom
domain set by `CNAME`.

## Local preview

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Serving over HTTP matters — the pages use
absolute paths like `/assets/style.css`, which do not resolve over `file://`.

## Adding a tool

Each tool is a directory under `tools/` containing an `index.html`. Copy
`tools/_template/index.html` to start, then link it from the index on
`index.html` and add it to `sitemap.xml`. See [CLAUDE.md](CLAUDE.md) for the
full conventions.

---

Hash Brown Engineering Limited is a private limited company registered in
Scotland, no. SC644189. Registered office: 5 South Charlotte Street,
Edinburgh, EH2 4AN.
