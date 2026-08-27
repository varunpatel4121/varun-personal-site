# Changelog

All notable changes to this project are documented in this file.

## [0.2.0.0] - 2026-08-27

### Added

- Explore all seven InBody scans in one interactive body-evolution page with a chronological timeline, composition trends, regional lean-mass visualization, and a compact historical ledger.
- Open the merged private source archive from the page when signed into an authorized Google Drive account.

### Changed

- Plot trends using the real elapsed time between scans and derive dates, counts, summaries, and regional data from the scan records so future additions stay consistent.

### Fixed

- Keep the latest scan visible on mobile, provide keyboard-complete timeline navigation, expose horizontal-scroll cues at tablet sizes, honor reduced-motion preferences, and preserve readable pinned table labels.
- Cover the body timeline, trend controls, mobile behavior, accessibility states, reduced motion, source link, and scan-data integrity with automated browser and unit tests.
