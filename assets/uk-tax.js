/* ============================================================================
   uk-tax.js — shared UK tax data and primitives for the tools on this site.
   ============================================================================

   WHY THIS FILE EXISTS

   The take-home pay tool and the savings/dividends/gains tool each grew their
   own copy of the UK rate tables and their own band arithmetic. Two copies of
   the same statute drift: a Budget changes a rate and one page is updated. This
   file is the single place a rate lives, so a Budget is one edit.

   WHAT IS AND IS NOT HERE

   Here: the per-year rate data, the band primitives every tool needs, the
   personal allowance taper and its inverse, money and percentage formatting,
   and the self-check harness the tools report into.

   Not here: anything specific to one tool. How savings stack on dividends, how
   Universal Credit tapers, how a childcare cliff is drawn — those live with the
   page that draws them. The test is whether a second tool would want it.

   FOR A FUTURE TOOL (stamp duty, corporation tax)

   A progressive slice ladder — which is exactly what SDLT, LBTT and LTT are —
   is UKTax.ladder(). Feed it thresholds and rates and the band primitives below
   give you both the tax due (amountAt) and the marginal rate (rateAt) for free.
   Corporation tax marginal relief is not a slice system, so it does not fit the
   ladder; it wants its own function, but the formatting and the self-check
   harness here still apply. Neither needs the income tax engine at all.

   CONVENTIONS

   Bands are marginal rates: a list of { upTo, rate } sorted ascending, where
   `rate` applies while the value is below `upTo`, and the last entry has
   upTo: Infinity. Rates are percentages, not fractions.

   Income tax bands are held in TAXABLE income space — income after the personal
   allowance — because that is how the statute defines them. The familiar gross
   figures (£50,270 and so on) are derived by nonSavingsGross(). Deriving that
   way round matters: adding the allowance back is only correct below the taper,
   and an earlier version of one tool printed the additional rate threshold as
   £137,710 by getting it the wrong way round.

   No build step, no modules: this defines one global, UKTax, and every tool
   loads it with a plain <script src="/assets/uk-tax.js"> before its own script.
   ============================================================================ */

var UKTax = (function () {
    "use strict";

    /* ------------------------------------------------------------------
          TAX YEAR DATA
          ------------------------------------------------------------------
          To add a year: copy the most recent entry, update against the source
          noted beside each block, add the id to YEAR_ORDER, and update the
          pinned figures in each tool that uses the block you changed. Every
          tool self-checks on load, so a mistyped figure fails loudly.
          ------------------------------------------------------------------ */

    var YEARS = {
        "2025-26": {
            label: "2025/26",
            // gov.uk/government/publications/rates-and-allowances-income-tax
            personalAllowance: 12570,
            taperStart: 100000,          // allowance withdrawn £1 per £2 above this
            basicRateLimit: 37700,       // taxable income; £50,270 gross with a full allowance
            higherRateLimit: 125140,     // taxable income at which the additional rate starts
            nonSavings: {
                ruk: [
                    { upTo: 37700,    rate: 20, name: "Basic rate" },
                    { upTo: 125140,   rate: 40, name: "Higher rate" },
                    { upTo: Infinity, rate: 45, name: "Additional rate" }
                ],
                // gov.scot/publications/scottish-income-tax-rates-and-bands
                sco: [
                    { upTo: 2827,     rate: 19, name: "Starter rate" },
                    { upTo: 14921,    rate: 20, name: "Basic rate" },
                    { upTo: 31092,    rate: 21, name: "Intermediate rate" },
                    { upTo: 62430,    rate: 42, name: "Higher rate" },
                    { upTo: 125140,   rate: 45, name: "Advanced rate" },
                    { upTo: Infinity, rate: 48, name: "Top rate" }
                ]
            },
            // The announced two point rise on savings does not begin until 6 April 2027.
            savings: { startingRateBand: 5000, psaBasic: 1000, psaHigher: 500, rates: [20, 40, 45] },
            dividends: { allowance: 500, rates: [8.75, 33.75, 39.35] },
            // BADR rose from 10% to 14% on 6 April 2025.
            cgt: { aea: 3000, lower: 18, upper: 24, badr: 14, badrLimit: 1000000 },
            /* Inheritance tax. The nil-rate band, the residence nil-rate band and
                  the £2,000,000 taper threshold are frozen to the end of 2030-31.
                  100% agricultural and business property relief was UNCAPPED until
                  5 April 2026, which `allowance: Infinity` states arithmetically so
                  the same expression serves both years. */
            inheritanceTax: {
                rate: 40, reducedRate: 36, charityShare: 10,
                nilRateBand: 325000, residenceNilRateBand: 175000,
                taperThreshold: 2000000,
                businessRelief: { allowance: Infinity, rateAbove: 100 }
            },
            /* Corporation tax is charged by FINANCIAL year (1 April to 31 March),
                  not by tax year, so the two calendars do not line up. It happens not
                  to matter for the years here: FY2025 and FY2026 carry the same rates,
                  unchanged since the structure was introduced on 1 April 2023. If a
                  future financial year diverges mid-tax-year, this needs splitting.
                  Marginal relief is main rate on the whole profit, less the fraction
                  times the distance below the upper limit; the limits are divided by
                  one plus the number of associated companies. */
            corporationTax: { smallRate: 19, mainRate: 25, lowerLimit: 50000,
                              upperLimit: 250000, fraction: 3 / 200 },
            employeeNI: { primaryThreshold: 12570, upperEarningsLimit: 50270, mainRate: 8, upperRate: 2 },
            employerNI: { secondaryThreshold: 5000, rate: 15, employmentAllowance: 10500 },
            // The annual allowance has been £60,000 since 6 April 2023. The
            // taper for high earners and unused carry-forward are not here.
            pension: { annualAllowance: 60000, taxFreeShare: 25 },
            studentLoans: {
                // No Plan 5: no Plan 5 repayments fell due before April 2026.
                plans: [
                    { id: "p1", label: "Plan 1", threshold: 26065, rate: 9 },
                    { id: "p2", label: "Plan 2", threshold: 28470, rate: 9 },
                    { id: "p4", label: "Plan 4", threshold: 32745, rate: 9 }
                ],
                postgraduate: { label: "postgraduate", threshold: 21000, rate: 6 }
            },
            childBenefit: { eldest: 26.05, other: 17.25, weeks: 52 },
            hicbc: { start: 60000, end: 80000 },
            childcare: { cliff: 100000, tfcPerChild: 2000, fundedHours: 1140 },
            // gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026
            // Monthly figures, as UC is assessed and published monthly.
            universalCredit: {
                taper: 55,
                standardAllowance: { single: 400.14, couple: 628.10 },
                workAllowance: { withHousing: 411, withoutHousing: 684 },
                childFirst: 292.81,        // higher rate only for a child born before 6 April 2017
                childOther: 292.81,
                twoChildLimit: true,
                lcwra: 423.27,
                lcwraProtected: 423.27
            }
        },

        "2026-27": {
            label: "2026/27",
            personalAllowance: 12570,
            taperStart: 100000,
            basicRateLimit: 37700,       // thresholds remain frozen
            higherRateLimit: 125140,
            nonSavings: {
                ruk: [
                    { upTo: 37700,    rate: 20, name: "Basic rate" },
                    { upTo: 125140,   rate: 40, name: "Higher rate" },
                    { upTo: Infinity, rate: 45, name: "Additional rate" }
                ],
                // Scottish starter, basic and intermediate thresholds up 7.4%,
                // the rest frozen.
                sco: [
                    { upTo: 3967,     rate: 19, name: "Starter rate" },
                    { upTo: 16956,    rate: 20, name: "Basic rate" },
                    { upTo: 31092,    rate: 21, name: "Intermediate rate" },
                    { upTo: 62430,    rate: 42, name: "Higher rate" },
                    { upTo: 125140,   rate: 45, name: "Advanced rate" },
                    { upTo: Infinity, rate: 48, name: "Top rate" }
                ]
            },
            savings: { startingRateBand: 5000, psaBasic: 1000, psaHigher: 500, rates: [20, 40, 45] },
            // Ordinary and upper dividend rates up two points from 6 April 2026;
            // the additional rate was left alone.
            dividends: { allowance: 500, rates: [10.75, 35.75, 39.35] },
            // BADR rose again, from 14% to 18%, on 6 April 2026.
            cgt: { aea: 3000, lower: 18, upper: 24, badr: 18, badrLimit: 1000000 },
            /* From 6 April 2026 the 100% agricultural and business property relief
                  is capped. The cap was announced at £1,000,000 at the Autumn Budget
                  2024 and raised to £2,500,000 on 23 December 2025. It is
                  transferable between spouses, so a widowed estate has £5,000,000
                  of it. Value above the cap gets 50% relief -- an effective 20%
                  inheritance tax rate rather than nil. */
            inheritanceTax: {
                rate: 40, reducedRate: 36, charityShare: 10,
                nilRateBand: 325000, residenceNilRateBand: 175000,
                taperThreshold: 2000000,
                businessRelief: { allowance: 2500000, rateAbove: 50 }
            },
            /* Corporation tax is charged by FINANCIAL year (1 April to 31 March),
                  not by tax year, so the two calendars do not line up. It happens not
                  to matter for the years here: FY2025 and FY2026 carry the same rates,
                  unchanged since the structure was introduced on 1 April 2023. If a
                  future financial year diverges mid-tax-year, this needs splitting.
                  Marginal relief is main rate on the whole profit, less the fraction
                  times the distance below the upper limit; the limits are divided by
                  one plus the number of associated companies. */
            corporationTax: { smallRate: 19, mainRate: 25, lowerLimit: 50000,
                              upperLimit: 250000, fraction: 3 / 200 },
            employeeNI: { primaryThreshold: 12570, upperEarningsLimit: 50270, mainRate: 8, upperRate: 2 },
            employerNI: { secondaryThreshold: 5000, rate: 15, employmentAllowance: 10500 },
            // The annual allowance has been £60,000 since 6 April 2023. The
            // taper for high earners and unused carry-forward are not here.
            pension: { annualAllowance: 60000, taxFreeShare: 25 },
            studentLoans: {
                plans: [
                    { id: "p1", label: "Plan 1", threshold: 26900, rate: 9 },
                    { id: "p2", label: "Plan 2", threshold: 29385, rate: 9 },
                    { id: "p4", label: "Plan 4", threshold: 33795, rate: 9 },
                    { id: "p5", label: "Plan 5", threshold: 25000, rate: 9 }
                ],
                postgraduate: { label: "postgraduate", threshold: 21000, rate: 6 }
            },
            // gov.uk/child-benefit-rates
            childBenefit: { eldest: 27.05, other: 17.90, weeks: 52 },
            hicbc: { start: 60000, end: 80000 },
            childcare: { cliff: 100000, tfcPerChild: 2000, fundedHours: 1140 },
            /* The two-child limit is removed from 6 April 2026, and the health
                  element splits: claims already in payment, terminal illness and the
                  severe conditions criteria keep the protected rate, while a new
                  award drops to less than half of it. */
            universalCredit: {
                taper: 55,
                standardAllowance: { single: 424.90, couple: 666.97 },
                workAllowance: { withHousing: 427, withoutHousing: 710 },
                childFirst: 303.94,
                childOther: 303.94,
                twoChildLimit: false,
                lcwra: 217.26,
                lcwraProtected: 429.80
            }
        }
    };

    var YEAR_ORDER = ["2026-27", "2025-26"];    // newest first

    var REGIONS = [
        { id: "ruk", label: "England, Wales & NI", dash: null },
        { id: "sco", label: "Scotland",            dash: "7 4" }
    ];

    /* ------------------------------------------------------------------
          BAND PRIMITIVES
          Generic: nothing below knows it is about tax. A stamp duty ladder
          uses exactly these.
          ------------------------------------------------------------------ */

    function bandAt(bands, x) {
        for (var i = 0; i < bands.length; i++) if (x < bands[i].upTo) return bands[i];
        return bands[bands.length - 1];
    }
    function rateAt(bands, x) { return bandAt(bands, x).rate; }

    /* Cumulative amount up to x. The band list is marginal rates, so the amount
          charged is their integral: each band's rate applied to the slice falling
          inside it. */
    function amountAt(bands, x) {
        if (!(x > 0)) return 0;
        var total = 0, prev = 0;
        for (var i = 0; i < bands.length; i++) {
            var top = Math.min(bands[i].upTo, x);
            if (top > prev) total += (top - prev) * bands[i].rate / 100;
            if (bands[i].upTo >= x) break;
            prev = bands[i].upTo;
        }
        return total;
    }

    /* Charge `amount` starting at position `pos` — for income stacked on top of
          other income rather than measured from zero. */
    function sliceTax(pos, amount, bands) {
        var tax = 0;
        for (var i = 0; i < bands.length && amount > 1e-12; i++) {
            if (pos >= bands[i].upTo) continue;
            var take = Math.min(amount, bands[i].upTo - pos);
            tax += take * bands[i].rate / 100;
            pos += take;
            amount -= take;
        }
        return tax;
    }

    /* Merge band lists, summing rates. The first list leads the band name; the
          rest contribute their `short` label only where they are actually charging
          something, so a combined line can say what makes it up. */
    function combineBands(lists) {
        var cuts = [], seen = {};
        lists.forEach(function (list) {
            list.forEach(function (bd) {
                var k = String(bd.upTo);
                if (!seen[k]) { seen[k] = 1; cuts.push(bd.upTo); }
            });
        });
        cuts.sort(function (p, q) { return p - q; });
        var out = [], prev = 0;
        cuts.forEach(function (upTo) {
            var sample = isFinite(upTo) ? (prev + upTo) / 2 : prev + 1000;
            var hit = lists.map(function (l) { return bandAt(l, sample); });
            var total = hit.reduce(function (t, b) { return t + b.rate; }, 0);
            var extras = hit.slice(1).filter(function (b) { return b.rate > 0; })
                                     .map(function (b) { return b.short; });
            out.push({
                upTo: upTo,
                rate: Math.round(total * 1000) / 1000,
                name: extras.length ? hit[0].name + " + " + extras.join(" + ") : hit[0].name
            });
            prev = upTo;
        });
        return out;
    }

    /* A progressive slice ladder from [[upTo, rate], ...]. This is the shape of
          SDLT, LBTT and LTT: each slice of the price is charged at its own rate. */
    function ladder(cuts, names) {
        return cuts.map(function (c, i) {
            return { upTo: c[0], rate: c[1], name: names && names[i] ? names[i] : "" };
        });
    }

    /* ------------------------------------------------------------------
          INCOME TAX SPECIFICS
          ------------------------------------------------------------------ */

    function year(id) { return YEARS[id]; }
    function taperEnd(y) { return y.taperStart + 2 * y.personalAllowance; }

    // The allowance is withdrawn £1 for every £2 above the taper start. Capital
    // gains are not income, so they never appear in the figure passed in here.
    function personalAllowance(y, totalIncome) {
        return Math.max(0, y.personalAllowance - Math.max(0, (totalIncome - y.taperStart) / 2));
    }

    // £1,000 for a basic rate taxpayer, £500 for a higher rate one, nothing for
    // an additional rate one — tested against the UK limits even in Scotland.
    function personalSavingsAllowance(y, totalTaxable) {
        if (totalTaxable <= y.basicRateLimit) return y.savings.psaBasic;
        if (totalTaxable <= y.higherRateLimit) return y.savings.psaHigher;
        return 0;
    }

    /* The gross income that produces a given taxable income. Adding the
          allowance back is only right below the taper: inside it every extra pound
          of income costs 1.5 pounds of taxable income, and above it the allowance
          is gone and the two coincide. */
    function grossFor(y, taxable) {
        if (!isFinite(taxable)) return Infinity;
        var pa = y.personalAllowance, ts = y.taperStart;
        if (taxable <= ts - pa) return taxable + pa;
        if (taxable >= taperEnd(y)) return taxable;
        return (taxable + pa + ts / 2) / 1.5;
    }

    function taxableFor(y, gross) {
        return Math.max(0, gross - personalAllowance(y, gross));
    }

    /* The non-savings bands restated against GROSS income, which is how both
          governments publish them and what a tool plotting against salary wants.
          Returns [{ to, rate, name }] with the last `to` Infinity. */
    function nonSavingsGross(y, region) {
        return y.nonSavings[region].map(function (b) {
            return { to: grossFor(y, b.upTo), rate: b.rate, name: b.name };
        });
    }

    /* A whole income tax position: where each slice of income sits and which
          nil-rate bands reach it. Both the tax and the band labels are read from
          the same object, so a label can never disagree with the number beside
          it. Savings and dividends stack on top of other income in that order,
          which is what makes the marginal rate on any of them depend on all of
          the others.

          The personal allowance is set against other income first, then savings,
          then dividends. It may in fact be allocated in whichever way is most
          beneficial; the conventional ordering is used here. */
    function incomeTaxPosition(y, other, savings, dividends) {
        other = Math.max(0, other);
        savings = Math.max(0, savings);
        dividends = Math.max(0, dividends);

        var total = other + savings + dividends;
        var pa = personalAllowance(y, total);
        var paOther = Math.min(pa, other), rem = pa - paOther;
        var paSav = Math.min(rem, savings); rem -= paSav;
        var paDiv = Math.min(rem, dividends);

        var oT = other - paOther, sT = savings - paSav, dT = dividends - paDiv;
        var totalT = oT + sT + dT;

        // The starting rate band is the first £5,000 of taxable income, so
        // non-savings income eats into it before any interest gets there.
        var srsUsed = Math.max(0, Math.min(sT, y.savings.startingRateBand - oT));
        var psa = personalSavingsAllowance(y, totalT);
        var psaUsed = Math.max(0, Math.min(psa, sT - srsUsed));
        var daUsed = Math.min(y.dividends.allowance, dT);

        return { pa: pa, paOther: paOther, paSav: paSav, paDiv: paDiv,
                 oT: oT, sT: sT, dT: dT, totalT: totalT,
                 srsUsed: srsUsed, psa: psa, psaUsed: psaUsed, daUsed: daUsed };
    }

    /* Income tax on a position. The nil-rate bands are not deductions: they sit
          at the bottom of their slice and use up band space, which is why the taxed
          remainder starts above them rather than where the slice began. */
    function taxFromPosition(y, region, P) {
        return sliceTax(0, P.oT, y.nonSavings[region])
             + sliceTax(P.oT + P.srsUsed + P.psaUsed, P.sT - P.srsUsed - P.psaUsed,
                        ukBands(y, y.savings.rates))
             + sliceTax(P.oT + P.sT + P.daUsed, P.dT - P.daUsed, ukBands(y, y.dividends.rates));
    }

    function incomeTaxOn(y, region, other, savings, dividends) {
        return taxFromPosition(y, region, incomeTaxPosition(y, other, savings, dividends));
    }

    // The UK-wide bands savings and dividends are charged in, in taxable space.
    function ukBands(y, rates) {
        return [{ upTo: y.basicRateLimit,  rate: rates[0] },
                { upTo: y.higherRateLimit, rate: rates[1] },
                { upTo: Infinity,          rate: rates[2] }];
    }

    /* Corporation tax, including marginal relief. The relief makes the rate on
          a pound of profit inside the band HIGHER than the main rate -- 26.5% against
          25% on the standard figures -- because each extra pound of profit also
          withdraws some relief. Continuous at both limits, which the tools assert. */
    function corporationTax(y, profit, associates) {
        var ct = y.corporationTax;
        if (!(profit > 0)) return 0;
        var n = 1 + Math.max(0, associates || 0);
        var lower = ct.lowerLimit / n, upper = ct.upperLimit / n;
        if (profit <= lower) return profit * ct.smallRate / 100;
        if (profit >= upper) return profit * ct.mainRate / 100;
        return profit * ct.mainRate / 100 - ct.fraction * (upper - profit);
    }

    function employeeNIBands(y) {
        var n = y.employeeNI;
        return [
            { upTo: n.primaryThreshold, rate: 0, name: "Below primary threshold", short: "" },
            { upTo: n.upperEarningsLimit, rate: n.mainRate,
                name: "Main rate (" + n.mainRate + "%)", short: "NI " + n.mainRate + "%" },
            { upTo: Infinity, rate: n.upperRate,
                name: "Above upper earnings limit (" + n.upperRate + "%)",
                short: "NI " + n.upperRate + "%" }
        ];
    }

    function employerNIBands(y) {
        var e = y.employerNI;
        return [
            { upTo: e.secondaryThreshold, rate: 0, name: "Below the secondary threshold", short: "" },
            { upTo: Infinity, rate: e.rate, name: "Secondary rate (" + e.rate + "%)",
                short: "employer NI " + e.rate + "%" }
        ];
    }

    /* ------------------------------------------------------------------
          FORMATTING
          pct takes the decimal places explicitly: the tools disagree on how
          many are wanted, and a shared default would silently change one of
          them. One decimal reads better for whole-percent tax rates; two are
          needed where a dividend rate is 33.75%.
          ------------------------------------------------------------------ */

    function gbp(v) { return "£" + Math.round(v).toLocaleString("en-GB"); }
    function gbpPence(v) {
        return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    /* Compact money for an axis tick. Goes up to millions: an inheritance tax
          chart runs to £10,000,000, and "£10000k" is not a label. */
    function gbpShort(v) {
        if (v === 0) return "£0";
        var a = Math.abs(v);
        if (a < 1000) return "£" + Math.round(v);
        if (a < 1000000) return "£" + (v % 1000 === 0 ? v / 1000 : Math.round(v / 1000)) + "k";
        var m = Math.round(v / 10000) / 100;
        return "£" + m + "m";
    }
    function pct(r, dp) {
        var f = Math.pow(10, dp === undefined ? 1 : dp);
        return (Math.round(r * f) / f) + "%";
    }

    /* ------------------------------------------------------------------
          SELF-CHECK HARNESS
          Every tool on this site verifies itself on load and reports into its
          assumptions panel. This is the shared plumbing: collect results, then
          render a pass line or a loud failure.
          ------------------------------------------------------------------ */

    function checker() {
        var results = [], failures = [];
        return {
            check: function (name, ok, detail) {
                results.push(!!ok);
                if (!ok) failures.push(name + (detail ? " — " + detail : ""));
            },
            // Relative comparison with an absolute floor, because a value that
            // should be zero comes back as 1e-14 and no relative tolerance can
            // accept that.
            near: function (a, b, tol, abs) {
                if (a === b) return true;
                if (!isFinite(a) || !isFinite(b)) return false;
                return Math.abs(a - b) <= (tol === undefined ? 0.01 : tol)
                                        + (abs === undefined ? 0 : abs);
            },
            results: function () { return results; },
            failures: function () { return failures; },
            report: function (elementId, context, globalName) {
                var passed = results.filter(Boolean).length;
                var out = document.getElementById(elementId);
                if (failures.length) {
                    out.className = "selfcheck bad";
                    out.textContent = "✖ " + failures.length + " of " + results.length
                        + " self-checks FAILED: " + failures.slice(0, 6).join("; ")
                        + (failures.length > 6 ? "; …" : "");
                    if (window.console) console.error("Self-checks failed:", failures);
                } else {
                    out.className = "selfcheck ok";
                    out.textContent = "✓ " + passed + " self-checks passed"
                        + (context ? " " + context : "") + ".";
                }
                var summary = { passed: passed, total: results.length, failures: failures };
                if (globalName) window[globalName] = summary;
                return summary;
            }
        };
    }

    /* The UK tax year starts on 6 April. A tool uses this to warn when the
          calendar has moved into a year its data does not cover. */
    function currentTaxYearId(d) {
        d = d || new Date();
        var m = d.getMonth();
        var start = (m > 3 || (m === 3 && d.getDate() >= 6)) ? d.getFullYear() : d.getFullYear() - 1;
        return start + "-" + ("0" + ((start + 1) % 100)).slice(-2);
    }

    return {
        YEARS: YEARS, YEAR_ORDER: YEAR_ORDER, REGIONS: REGIONS, year: year,
        bandAt: bandAt, rateAt: rateAt, amountAt: amountAt, sliceTax: sliceTax,
        combineBands: combineBands, ladder: ladder,
        taperEnd: taperEnd, personalAllowance: personalAllowance,
        personalSavingsAllowance: personalSavingsAllowance,
        grossFor: grossFor, taxableFor: taxableFor,
        nonSavingsGross: nonSavingsGross, ukBands: ukBands,
        incomeTaxPosition: incomeTaxPosition, taxFromPosition: taxFromPosition,
        incomeTaxOn: incomeTaxOn,
        corporationTax: corporationTax,
        employeeNIBands: employeeNIBands, employerNIBands: employerNIBands,
        gbp: gbp, gbpPence: gbpPence, gbpShort: gbpShort, pct: pct,
        checker: checker, currentTaxYearId: currentTaxYearId
    };
})();
