# Changelog

All notable changes to this project will be documented in this file.

Versioning of this project adheres to the [Semantic Versioning](https://semver.org/spec/v2.0.0.html) spec.

## [1.1.0]

Released 2025-03-29

- Upgrade to `@osmcha/maplibre-adiff-viewer` v1.2.1
- Show relation members (and modifications thereof) when clicking on relations
- Use tagged template strings (using `htm` and `vhtml`) to generate content for
  the popup; split into a few distinct components
- Restyle the popup content to be more similar to the new OSMCha design
  (same colors, diff symbols at start of each row, modifications shown with
  a '→' arrow)

## [1.0.1]

Released 2025-02-26

- Upgrade `@osmcha/maplibre-adiff-viewer` to v1.1.1, fixing a UI bug where the map
  would sometimes fail to zoom to the bounding box of the input adiff

## [1.0.0]

Released 2025-02-03

Initial release.

[1.1.0]: https://github.com/OSMCha/osmcha-cli/releases/tag/v1.1.0
[1.0.1]: https://github.com/OSMCha/osmcha-cli/releases/tag/v1.0.1
[1.0.0]: https://github.com/OSMCha/osmcha-cli/releases/tag/v1.0.0
