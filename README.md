# TrueComp

Sold-comparables and repricing intelligence for luxury, archive, and avant-garde menswear resale.

Sneakers have style codes. Archive and avant-garde fashion does not. A piece is known by brand, garment archetype, a season code like SS09 or AW04, and a community model name like Detroit Cut or Ramones, and almost no seller tags all of it. The hard problem here is not scraping. It is resolving the same physical piece across marketplaces that share no key, then turning sparse, noisy sold data into a defensible price answer: what does this sell for, where, how fast, and what should I list it at.

Scope is menswear only.

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

Ingestion runs on Apify plus GitHub Actions, never on Vercel. Every source enters through an adapter so a renamed or broken actor is a one-file swap, and no source-specific field leaks past that boundary. Storage is Neon. Analytics live in SQL and dbt marts. The frontend only queries and renders.

## Data sources

| Source | Role | Sold date |
|---|---|---|
| Grailed (menswear, sold) | designer/archive price level | not trustworthy; undated comps |
| eBay (sold) | broad sold comps and the trusted sold date | drives the time series |
| Yahoo Auctions Japan | archive Japanese labels, added later | at source |

A few rules the data forces, enforced at the adapter boundary: Grailed's sold timestamp is scrape time, so Grailed rows carry no sold date and inform price level only; eBay's ended date is the only trusted sale date. eBay prices arrive as strings and are cast or rejected, never coerced to zero. Best-offer sales are kept but flagged. Condition vocabularies differ per source and are never joined on raw text. Everything normalizes to USD while keeping the original amount and currency.

## Layout

```
ingestion/adapters/   one anti-corruption adapter per source
resolution/           entity resolution and normalization
db/schema.sql         canonical star schema
dbt_project/          staging -> intermediate -> marts
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

Copy `.env.example` to `.env` and fill in `APIFY_TOKEN` and `DATABASE_URL`.

## Progress

- [x] Phase 0: schema locked, corpus fixtures in place, repo scaffolded
- [x] Phase 1: ingestion and normalization
- [x] Phase 2: entity resolution
- [x] Phase 3: marts and analytics
- [ ] Phase 4: standalone site (built and verified locally; deploy pending)
- [x] Phase 5: price model and arbitrage detection
