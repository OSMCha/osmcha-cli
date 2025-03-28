# osmcha-cli

This is a command line tool for visualizing changes to OpenStreetMap (loaded from an [augmented diff](https://wiki.openstreetmap.org/wiki/Overpass_API/Augmented_Diffs) file) on a map in your browser.

It is similar to the [osmcha.org](https://osmcha.org) interface in that both can display changes made to OSM on a map. However, `osmcha-cli` is more flexible in that it can load and display any augmented diff file, regardless of what that file represents (it could represent a single changeset, or a collection of changes made by many users, or even a change you're preparing in JOSM but haven't uploaded yet).

## Installation

This tool is written in Rust and is published to [crates.io](https://crates.io/crates/osmcha-cli). If you have a Rust toolchain installed, you can download and build it by running:

```
$ cargo install osmcha-cli
```

You can also clone this repository and run `cargo install --path .` in it.

## Usage

Let's first get some augmented diff data to visualize. In this example I'll use [overpass-cli](https://github.com/jake-low/overpass-cli) to create a diff file representing all changes made to roads in Kauai, HI in 2024.

```
$ overpass --adiff 2024-01-01T00:00:00Z 2025-01-01T00:00:00Z \
           --bbox -159.83 21.84 -159.24 22.24 \
           --out geom \
           'way[highway]' \
  > kauai.adiff
```

From there you can run the `osmcha` command line program to view the result.

```
$ osmcha kauai.adiff
listening on http://localhost:48756
```

Your browser should open automatically and display something like this:

![Screenshot of the osmcha-cli browser interface showing roads in Kauai](./screenshot.png)

Clicking on individual features will open a popup that shows details about what was changed.

## Implementation

`osmcha-cli` uses components from OSMCha:

- [osm-adiff-parser](https://github.com/OSMCha/osm-adiff-parser) to parse augmented diff XML files
- [maplibre-adiff-viewer](https://github.com/OSMCha/maplibre-adiff-viewer) to render diffs on a MapLibre map

You can use these components in your own projects if you want to visualize changes on a map in the style of OSMCha.

## License

This program's source code is available under the ISC License. See the [LICENSE](./LICENSE) file for details.
