# vtex-xml-transformer

HTTP service that downloads a VTEX store product XML and transforms it into a feed for Google Merchant Center or Meta (Facebook/Instagram), applying price, stock and product URLs per region and sales channel.

## Endpoints

- `GET /status` — running version
- `GET /xml-parse` — Google Shopping feed
- `GET /xml-parse-meta` — Meta catalog feed

### Google Shopping

```
GET /xml-parse?storeDomain=mystore.vtexcommercestable.com.br&storeName=mystore&xmlName=google_shopping&regionId=south&salesChannel=1
```

| Param | Required | Description |
|---|---|---|
| `storeDomain` | yes | Store domain used to build product URLs |
| `storeName` | yes | VTEX account name (`{storeName}.myvtex.com`) |
| `xmlName` | yes | XML file name in VTEX, without extension |
| `regionId` | yes | Value written to `g:region_id` |
| `salesChannel` | yes | VTEX sales channel (`sc`) used for price and stock |
| `complete` | no | `1` outputs the full product item (title, description, link, image, price, etc.). Without it, outputs a regional inventory item only (`id`, `region_id`, `price`, `sale_price`, `availability`) |
| `isMainFeed` | no | With `complete=1`: primary feed mode. No `region_id` and no `sale_price`, availability forced to `out of stock` (regional feeds turn stock on per region) |
| `feedLabel` | no | Feed label of the Merchant Center data source this file feeds. Metadata only: written to `g:custom_label_0` (with `complete=1`) and to the trailing XML comment. Letters, digits, `-`, `_`, max 20 chars. See [Feed label](#feed-label) |
| `utm` | no | `1` (default) keeps `utm_*` from the XML untouched, `0` removes them |
| `utmSource`, `utmMedium`, `utmCampaign`, `utmContent` | no | Override UTM values (ignored when `utm=0`). Not sent = XML UTMs kept as-is |
| `customProductUrlType` | no | Product URL format, e.g. `prefix-detail` |
| `globalCategory` | no | Fallback for `g:google_product_category` |
| `imageIndex`, `imageMatch` | no | Choose `g:image_link` (only with `complete`). See [Image selection](#image-selection). Without a match, the XML image is kept |

#### Feed label

The Merchant Center feed label is a setting of the data source, not an attribute inside the XML. To run one label per region, register two data sources under the same label:

```
# primary: full catalog, all out of stock, price and link for the region sales channel
GET /xml-parse?storeDomain=mystore.vtexcommercestable.com.br&storeName=mystore&xmlName=google_shopping&salesChannel=2&regionId=south&complete=1&isMainFeed=1&feedLabel=SOUTH

# regional inventory (same label): turns stock and price on inside the region
GET /xml-parse?storeDomain=mystore.vtexcommercestable.com.br&storeName=mystore&xmlName=google_shopping&salesChannel=2&regionId=south
```

`feedLabel` only tags the file (`g:custom_label_0` and the trailing comment) so campaigns can group and report by it.

### Meta (Facebook / Instagram)

```
GET /xml-parse-meta?storeDomain=mystore.vtexcommercestable.com.br&storeName=mystore&xmlName=facebook&salesChannel=1&idType=sku&utm=1
```

| Param | Required | Description |
|---|---|---|
| `storeDomain` | yes | Store domain used to build product URLs |
| `storeName` | yes | VTEX account name |
| `xmlName` | yes | XML file name in VTEX, without extension |
| `salesChannel` | yes | VTEX sales channel (`sc`) used for price and stock |
| `idType` | no | `sku` (default) or `product` (dedupe by product, prefer available SKU) |
| `utm` | no | `1` (default) keeps `utm_*` from the XML, `0` removes them |
| `utmSource`, `utmMedium`, `utmCampaign`, `utmContent` | no | Override UTM values (ignored when `utm=0`) |
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
