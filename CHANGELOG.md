# Changelog

## [1.0.3] - 10-08-2026 at 6:21pm

- Dropped a vendor-specific AI coding tool from the intro's CI/CD tool list and from the Tech Journey blurb, so the profile reads as multi-model rather than tied to one vendor.
- Re-rendered the Tech Journey feature card from RJL.pub's book-cover preview instead of its social preview, whose baked-in tagline named that same tool.

## [1.0.2] - 10-08-2026 at 6:05pm

- Refreshed the Jimmy Ketchup humor card from the site's new OG image ("Small packet. Big adventures.") and updated its alt text to match.

## [1.0.1] - 10-08-2026 at 5:48pm

- Renamed the tools section to "Tools, References & Technology" and reworked its 3-up grid: added NowUTC, OldClock.digital, and ASCIILogo as tool cards and NewStack.dev, NewStack.ai, and JSON5.dev as technology cards; removed AIPrompts.free, Scan.camera, and SecretNetflix.codes.
- Added JimmyKetchup, Fake News Maker, and Gen2 as humor cards, making both galleries an even 3x3.
- Carded sites are no longer repeated as caption text in those two sections; the caption lines keep only the links that have no card.

## [1.0.0] - 10-08-2026 at 5:19pm

- Redesigned the profile README around images: a rendered header banner (name, "AI that ships, not AI theater", and four stats checked against the master resume), linked OG-image card grids for the leadership, tools, and humor sections, and a full-width Tech Journey feature card. Each grid ends in a compact caption line so every link stays readable as text.
- Fixed inaccurate entries: RJL.io is described as the developer-tools site it is, RJLCustom404 is listed as MIT (not GPL-3.0), Schema.md is dropped because the domain is being retired, and AIDLC.guru, NewStack.ai, NewStack.dev, JSON5.dev, and AICoaster.dev are added.
- Added the Playwright scripts that render, compress, and preview the README images in GitHub light and dark themes, plus guard tests for image existence, size budgets, alt text, links, and ASCII-only content.
