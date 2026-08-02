# NovaMart controlled accessibility issues

These defects exist only for the bundled AccessForge demonstration. Source metadata is deliberately attached to affected elements.

| # | Intentional issue | Expected rule | Source | Expected repair | Validation |
|---|---|---|---|---|---|
| 1 | Meaningful first product image has empty alt | `image-alt` | `components/product-visual.tsx` | Add descriptive alternative text | axe + screen-reader name |
| 2 | Cart icon link lacks an accessible name | `link-name` | `components/site-header.tsx` | Add `aria-label="View cart"` | axe |
| 3 | Checkout address input has no label | `label` | `app/checkout/page.tsx` | Add a programmatic `<label>` | axe |
| 4 | First product Save button has poor contrast | `color-contrast` | `components/product-card.tsx` | Use readable foreground/background tokens | axe contrast check |
| 5 | Product cards begin at `h3` without an `h2` section heading in catalogue context | manual/heading-order | `components/product-card.tsx` | Provide correct surrounding hierarchy | heading outline review |
| 6 | Quick view uses a clickable `div` | manual/interactive-supports-focus | `components/quick-view.tsx` | Replace with `button` | keyboard test |
| 7 | Quick-view modal lacks Escape handling, initial focus, trapping, and restoration | manual | `components/quick-view.tsx` | Implement complete dialog focus lifecycle | keyboard test |
| 8 | Password field removes visible focus | manual/focus-visible | `app/account/sign-in/page.tsx` | Restore visible focus token | keyboard test |
| 9 | Newsletter error is not associated with its input | manual/aria-errormessage | `components/newsletter.tsx` | Add stable ID and `aria-describedby`/invalid state | screen-reader test |
| 10 | Checkout action is a clickable `div`, so keyboard activation fails | manual | `app/checkout/page.tsx` | Use a submit button | keyboard test |

Do not repair these fixtures casually: guided-demo reset and deterministic recipes rely on the documented original snippets.
