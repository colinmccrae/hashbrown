# hashbrowneng.com

The website for **Hash Brown Engineering Limited** — live at
<https://www.hashbrowneng.com>.

It is a plain static site with two jobs: a sober front page carrying the
company's statutory details, and an index of small web tools and experiments
that grows over time.

## Tools

| Tool | What it does |
|---|---|
| [UK Tax & Take-Home Pay](https://www.hashbrowneng.com/tools/uk-tax-rates/) | Marginal rates, effective rates and take-home pay for UK employees, 2025/26 and 2026/27, England/Wales/NI against Scotland. |
| [Unit Converter](https://www.hashbrowneng.com/tools/unit-converter/) | Pressure, temperature, flow, length, mass, volume, density, viscosity, energy and power conversions. |

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
