# TrueComp web

Thin read layer over the dbt marts. Server components query Neon; no business
logic lives here. All figures come from `mart_*` (and `int_sold_enriched` for
the distribution histogram).

## Local

```
cp .env.local.example .env.local   # paste the same DATABASE_URL as the root .env
npm install
npm run dev                        # http://localhost:3000
```

## Deploy (Vercel)

Set `DATABASE_URL` as a project environment variable, set the root directory to
`web/`, and deploy. The pipeline (Apify + GitHub Actions + dbt) runs elsewhere;
Vercel only serves this read layer.
