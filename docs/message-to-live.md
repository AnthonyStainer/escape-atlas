# Message-to-live updates

Anthony or Trenna can send Mei the result after a room. The Atlas repository is the only live history; the migration workbook remains evidence and is not maintained in parallel.

## Minimum input

- Game name.
- Completion date.
- Location and venue, either stated in the message or verified from the existing booking evidence.
- Completion time, or an explicit statement that no time was recorded.

Player count, game length, notes and a finish photo are optional. Unknown values stay `null`; they are never guessed.

## Publication pass

1. Reconcile the message against existing calendar, itinerary or venue evidence.
2. Confirm the next sequential ID and check for a duplicate date/location/venue/game record.
3. Append the room to `src/data/rooms.json` and update `source.recordCount` and `source.updated`.
4. If a supplied photo is intended for the public Atlas, store it under `public/images/rooms/` and add accessible alt text. Never publish booking references, QR codes, email addresses, phone numbers, payment details or raw calendar data.
5. Run `npm run check` and inspect the generated room page at desktop and mobile widths.
6. Commit and push only the bounded Atlas change.
7. Wait for GitHub verification and Cloudflare Pages deployment, then read back the homepage, history entry, room page, image and HTTPS response from `atlas.mei.place`.
8. Report the live link to Anthony.

## Corrections and rollback

For a factual correction, edit the same room record, re-run the full check, commit the correction and verify the live page. Do not add a second room to compensate for a typo.

For an unsafe or materially wrong publication, revert the offending commit, push the revert, and verify that Cloudflare serves the previous version. Preserve the original message or photo privately as evidence; do not rewrite Git history.

## First live proof

Room #160, Outatime at Escapable in Wakefield, was received by message on 11 July 2026 with a finish photo showing 37:18. The room record and photo are the first real message-to-live update after the initial 159-room migration.
