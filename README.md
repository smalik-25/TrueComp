# ReliQuery

Sold-comparable prices for archive and avant-garde menswear, resolved across marketplaces.

Live: https://reliquery.vercel.app

Sneakers have style codes. Archive and avant-garde fashion does not. A piece is known by its brand, a garment archetype, sometimes a season code like SS09 or AW04, and a community model name like Ramones or Detroit Cut, and almost no seller tags all of it. So the hard problem is not scraping. It is resolving the same physical piece across marketplaces that share no key, then turning sparse, noisy sold records into a price answer you can defend: what does this sell for, how many sales stand behind that number, and how far apart are the marketplaces on it.

ReliQuery is the site. TrueComp is the pipeline underneath it. The frontend is the thin part that queries and renders.

Scope is menswear only.

## What the site shows

- A searchable corpus of resolved pieces, each with a median sold price, a comp count, and a confidence grade from A to D that says how much data stands behind the median.
- A piece page: the price band, the distribution of individual sales, how fast it sells, how far it marks down from ask, and a cross-marketplace spread where one exists.
- A method page that explains how resolution works and, in the same breath, where it fails.

## Screens

![ReliQuery search](docs/reliquery-search.png)

![A piece page](docs/reliquery-piece.png)

## How it fits together

```
Apify actors (cloud scraping)
      |  trigger + pull dataset
      v
GitHub Actions (scheduled cron)          orchestrator
      |  per-source adapters -> canonical rows
      v
Entity resolution + USD/grade normalization
      v
Neon Postgres (canonical star schema)
      |  dbt (staging -> intermediate -> marts)
      v
dbt marts (comps, velocity, spreads, markdown, arbitrage)
      |  read-only queries
      v
Next.js on Vercel (thin read layer)
```

Ingestion runs on Apify plus GitHub Actions, never on Vercel. Every source enters through an adapter, so a renamed or broken actor is a one-file swap and no source-specific field leaks past that boundary. Storage is Neon. The analytics live in SQL and dbt marts. The frontend only queries and renders.

## What it does not claim

The site says what the data supports and no more, the same way the method page does.

- Grailed sold timestamps are scrape time, not sale time, so Grailed rows carry price level only and never a date. eBay's ended date is the only sale date the site trusts.
- A grade of C or D means the median rests on a handful of sales. The site shows the count and grades it rather than dressing a thin number up as a firm one.
- A recommended list price is anchored on sold comps where they exist and falls back to a brand-and-archetype level where they do not. It is a read on where the piece has cleared, not a promise of what yours will.
- The price model is measured against a plain brand-and-archetype median baseline and reported honestly, including where it does not beat that baseline.
- Cross-marketplace spread only appears where a piece has enough resolved sales on both sides to compare. That is a small set, and the site does not pretend otherwise.

## Data sources

| Source | Role | Sold date |
|---|---|---|
| Grailed (menswear, sold) | designer and archive price level | not trustworthy; undated comps |
| eBay (sold) | broad sold comps and the trusted sold date | drives the time series |
| Yahoo Auctions Japan | archive Japanese labels, added later | at source |

## Layout

```
ingestion/adapters/   one anti-corruption adapter per source
resolution/           entity resolution and normalization
db/schema.sql         canonical star schema
dbt_project/          staging -> intermediate -> marts
ml/                   price model and arbitrage detector
web/                  Next.js read layer (Vercel)
.github/workflows/    scheduled ingestion
```

## Local development

```
make install    # create .venv and install deps
make schema     # apply db/schema.sql to DATABASE_URL
make test       # run the adapter and resolution tests
make dbt        # build the marts
```

Copy `.env.example` to `.env` and fill in `APIFY_TOKEN` and `DATABASE_URL`. The web app reads the same `DATABASE_URL` from `web/.env.local`.

## Progress

- [x] Phase 0: schema locked, corpus fixtures in place, repo scaffolded
- [x] Phase 1: ingestion and normalization
- [x] Phase 2: entity resolution
- [x] Phase 3: marts and analytics
- [x] Phase 4: standalone site, deployed on Vercel
- [x] Phase 5: price model, evaluated honestly; arbitrage detector built, awaiting an active-listing pull
