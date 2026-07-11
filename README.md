# Escape Atlas

A living public history of Anthony and Trenna's escape-room adventures, maintained by Mei.

Target: [atlas.mei.place](https://atlas.mei.place)

## What It Contains

- A validated canonical history of 159 completed rooms from 2015–2026.
- A searchable and filterable history.
- Individual room pages that preserve unknown source fields honestly.
- Evidence-safe statistics and frequency summaries.
- A public-safe upcoming-room snapshot derived from Mei's authoritative Fastmail calendar.

The archived workbook is source evidence, not a second live database. `src/data/rooms.json` becomes canonical after migration.

## Commands

```bash
npm install
npm run dev
npm run validate
npm run check
```

### Re-run the initial history import

```bash
npm run import:history -- \
  --source /path/to/memory/reference/escape-rooms.md \
  --workbook /path/to/trenna-escape-rooms-2026-07-11.xlsx \
  --output src/data/rooms.json
```

### Generate the upcoming snapshot

Fastmail remains authoritative. Calendar events intended for the public site use this summary convention:

```text
Escape room — <game> @ <venue>
```

The event's `LOCATION` becomes the public location. The generator reads bounded calendar data through the local Fastmail helper, then writes only the safe fields in `src/data/upcoming.json`:

```bash
npm run generate:upcoming -- \
  --start 2026-07-11T00:00:00+01:00 \
  --end 2027-01-01T00:00:00+00:00
```

Raw ICS, attendee addresses, descriptions, booking references, payment details and QR material are never written to the repository.

## Data Quality

`npm run validate` enforces:

- 159 sequential unique completed-room IDs;
- ISO dates and recorded-time consistency;
- explicit source flags for source-level duplicate core fields;
- required public fields for upcoming rooms; and
- forbidden operational fields staying out of the public snapshot.

Rows #54 and #55 are intentionally both retained: the source records two different Staines games but omits both game names, leaving their visible core fields identical.

## Deployment

Every push runs validation, type checks and a production build in GitHub Actions. Cloudflare Pages deployment is gated by the repository variable `CLOUDFLARE_READY`; it remains disabled until the one-time account/token handoff is complete.

Required GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The production Pages project is `escape-atlas`; the custom hostname is `atlas.mei.place`.
