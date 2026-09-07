# vtex-xml-transformer

HTTP service that downloads a VTEX store product XML and transforms it into a feed for Google Merchant Center or Meta (Facebook/Instagram), applying price, stock and product URLs per region and sales channel.

## Endpoints

- `GET /status` — running version
- `GET /xml-parse` — Google Shopping feed
- `GET /xml-parse-meta` — Meta catalog feed

### Google Shopping

```
GET /xml-parse?storeDomain=www.mystore.com&storeName=mystore&xmlName=google_shopping&regionId=0001&salesChannel=1
```

| Param | Required | Description |
|---|---|---|
| `storeDomain` | yes | Store domain used to build product URLs |
| `storeName` | yes | VTEX account name (`{storeName}.myvtex.com`) |
| `xmlName` | yes | XML file name in VTEX, without extension |
| `regionId` | yes | Value written to `g:region_id` |
| `salesChannel` | yes | VTEX sales channel (`sc`) used for price and stock |
| `customProductUrlType` | no | Product URL format, e.g. `prefix-detail` |
| `globalCategory` | no | Fallback for `g:google_product_category` |

### Meta (Facebook / Instagram)

```
GET /xml-parse-meta?storeDomain=www.mystore.com&storeName=mystore&xmlName=facebook&salesChannel=1&idType=sku&utm=1
```

| Param | Required | Description |
|---|---|---|
| `storeDomain` | yes | Store domain used to build product URLs |
| `storeName` | yes | VTEX account name |
| `xmlName` | yes | XML file name in VTEX, without extension |
| `salesChannel` | yes | VTEX sales channel (`sc`) used for price and stock |
| `idType` | no | `sku` (default) or `product` (dedupe by product, prefer available SKU) |
| `utm` | no | `1` (default) keeps `utm_*` from the XML, `0` removes them |
| `utmSource`, `utmMedium`, `utmCampaign` | no | Override UTM values (ignored when `utm=0`) |
| `regionId` | no | Label only, written to the trailing XML comment |
| `customProductUrlType`, `globalCategory` | no | Same as Google |

## Running

```bash
bun install
bun run dev          # local, watch mode, port 8000
docker compose up    # production image (Bun 1.4.2, alpine)
```
