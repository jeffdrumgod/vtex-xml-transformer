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
| `imageIndex`, `imageMatch` | no | Choose `g:image_link` (only with `complete`). See [Image selection](#image-selection). Without a match, the XML image is kept |

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
| `imageIndex`, `imageMatch` | no | Choose `g:image_link`. See [Image selection](#image-selection). Without a match, falls back to the `_mck` image, then the first image |

### Image selection

Both params read the SKU images from the VTEX catalog API. They are mutually exclusive (sending both returns 400).

- `imageIndex`: 0-based position of the image (`imageIndex=0` is the first image).
- `imageMatch`: case-insensitive text searched in the image name or URL path (the `?v=` query string is ignored). The first image that contains it wins.

Each param may be sent only once. When neither is sent, or nothing matches, each route keeps its default behavior: Meta uses the `_mck` image, then the first image, then the XML `g:image_link`; Google keeps the XML `g:image_link`.

```
GET /xml-parse-meta?...&imageIndex=1
GET /xml-parse-meta?...&imageMatch=_rec
GET /xml-parse?...&complete=1&imageMatch=_mck
```

## Running

```bash
bun install
bun run dev          # local, watch mode, port 8000
docker compose up    # production image (Bun 1.4.2, alpine)
```
