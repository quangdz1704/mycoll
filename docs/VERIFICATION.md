# Verification — 2026-10-05

## Passed

- TypeScript and production build: `npm run build`.
- Unit tests: 9/9 via `npm test` (Vietnamese search/tags/category, pin/order/date sorting, URL/slug/price validation, safe upload cleanup after ambiguous failures).
- `npm audit`: 0 reported vulnerabilities after updating Vitest.
- Migration applied successfully on a disposable PostgreSQL 14 instance, with test-only Supabase `auth`/`storage` schema stand-ins.
- SQL security tests: public visibility, denied anonymous database/storage writes, denied non-admin writes/analytics, valid-click RPC, ignored inactive/unknown products, provisioned-admin CRUD/storage/summary, cross-store constraints, restricted nonempty category deletion. All checks passed.
- Independent code review: hidden-category products under admin sessions and unsafe upload cleanup identified and fixed; follow-up reported no Critical/Important findings.

## Browser verification

Used the real frontend and Supabase JavaScript SDK against `tests/fixtures/mock-supabase.mjs` on localhost:

1. Unauthenticated `/admin/products` redirected to `/admin/login`.
2. Signed in with fixture account; created Vietnamese category and checked generated slug.
3. Created product with affiliate URL, category, prices, tags and pin.
4. Tested real browser image decoding/compression, Storage SDK upload and saving its public URL through `tests/fixtures/upload.html`; image displayed on the admin list and storefront.
5. Visitor search `coc gom da lat`, category filter and product link succeeded; exact destination `https://example.com/affiliate-test` opened in a new tab and the fixture stored a click.
6. Dashboard showed 1 click and the product in top products.
7. Refresh `/admin/products` kept the authenticated session.
8. Deleting a category with a product showed the blocking warning; disabling the category removed its product even in the admin's public view.
9. Changing store name/bio updated the public profile.
10. Logout and reopening `/admin/products` redirected to login.

The browser extension could not select local files without its file-URL permission. The production picker UI was inspected, and the separate fixture upload page exercised the same image/storage/save services with an actual image file created in the browser. Selecting a file through the normal picker still needs confirmation on a real Supabase project.

Storefront preview at widths 375, 390 and 430: exactly two grid columns, document width equal to viewport (no horizontal overflow). Desktop at 1728: four columns, constrained content width, all 9 images loaded. Tag search and empty search/reset states verified. No application errors/warnings were captured; unrelated wallet-extension logs were excluded.

Screenshots: [desktop](storefront-desktop.jpg), [mobile](storefront-mobile.jpg).

## Pending external setup

- User has not created a Supabase project. Actual Supabase Auth, REST, Storage upload and RLS integration need verification after provisioning according to README.
- Vercel deployment was not performed: automatic approval review rejected source/build upload to that external destination because deployment authorization was not considered explicit. No hosted URL or production verification is claimed.
- Local development preview remains available at `http://127.0.0.1:5180/`, using read-only sample products.

The app is implemented and locally verified, but the production definition of done remains pending Supabase configuration, authorized deployment and checks against those real services.
