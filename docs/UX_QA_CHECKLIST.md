# Customer ecommerce UX QA checklist

Post-implementation verification matrix for the CORE brand + Apple motion + Neuro-UX pass.

## Brand / perception
- [ ] Plus Jakarta Sans is the default body font (not Inter)
- [ ] Primary actions use `#9747ff` → `#6f00ff` (not hot pink `#ec4899`)
- [ ] Surfaces read as `#0e0f13` / `#1b1b27` / `#191924`
- [ ] Body text ≥ 14px; captions ≥ 11px; no 7–8px labels on primary UI

## Motion
- [ ] OS reduced-motion disables decorative transitions
- [ ] Header drawer / cart / wishlist feel interruptible (Escape closes menu)
- [ ] No idle bounce/pulse on In Stock or hero blobs
- [ ] Order success auto-redirect can be paused (“Stay on this page”)

## Shopping P0 journeys
- [ ] Guest add-to-cart / wishlist → `/signin` (not a dead profile popup)
- [ ] Tablet 768–1279px: GigHub / Bids / Deals reachable (menu or nav)
- [ ] Category Quick Filters change the product list
- [ ] Bad PDP id shows “Listing not found” (not `$0.00`)
- [ ] Listing cards “View listing” opens PDP (no fake Contact Agent toast)
- [ ] Stars show 5 max; empty ratings say “No reviews yet”

## Trust
- [ ] No unconditional “Verified Listing / Verified Profile / Verified Buyer”
- [ ] No fabricated Est. $/mo
- [ ] Order failed copy does not mention PayPal-only
- [ ] `/gighub/escrow` redirects away from public playground
- [ ] Bid “AI scope” is user-written project scope (no fake warranty draft)

## SEO
- [ ] `/gighub`, `/bids`, `/deals`, `/search` set page titles via PageSEO
- [ ] Search supports `?q=`
- [ ] `robots.txt` disallows checkout/profile/orders/private routes
- [ ] Sitemap includes `/deals`; excludes auth pages

## Responsive viewports to spot-check
320 · 375 · 430 · 768 · 1280

## Device-only gaps (not verified in this pass)
- Physical iOS Safari WebView blur/GPU cost
- Real Square payment end-to-end
- Live API attribute schema matching Quick Filter ids (`bedrooms`, etc.)
