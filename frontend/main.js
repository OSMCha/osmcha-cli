import maplibre from "maplibre-gl";
import adiffParser from "@osmcha/osm-adiff-parser";
import { MapLibreAugmentedDiffViewer } from "@osmcha/maplibre-adiff-viewer";

let container = document.querySelector("main");
let shouldJumpToBounds = window.location.hash === "";

let map = new maplibre.Map({
  container,
  style: {
    version: 8,
    sources: {
      bing: {
        type: "raster",
        tiles: [
          "https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z",
          "https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z",
          "https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z",
          "https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z",
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "Imagery © Microsoft Corporation",
      },
    },
    layers: [
      {
        id: "imagery",
        type: "raster",
        source: "bing",
      },
    ],
  },
  maxZoom: 22,
  hash: true,
});

map.setMaxPitch(0);
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.keyboard.disableRotation();

let res = await fetch("/changeset.adiff");
let xml = await res.text();
let adiff = await adiffParser(xml);
let adiffViewer = new MapLibreAugmentedDiffViewer(adiff, { onClick });

let bounds = adiffViewer.bounds();
if (shouldJumpToBounds) {
  map.jumpTo(map.cameraForBounds(bounds, { padding: 50, maxZoom: 18 }));
}

map.once("load", () => {
  adiffViewer.addTo(map);
});

function onClick(event, action) {
  if (!action) {
    return;
  }

  let popup = new maplibre.Popup();
  popup.setMaxWidth(200);
  popup.setLngLat(event.lngLat);
  let htmlContent = "";

  let verb = null;
  switch (action.type) {
    case "create":
      verb = "created";
      break;
    case "modify":
      verb = "modified";
      break;
    case "delete":
      verb = "deleted";
      break;
  }

  htmlContent += `<p><strong>${action.new.type}/${action.new.id}</strong>${verb && " was " + verb}</p>`;

  let allKeys = new Set([...Object.keys(action.old.tags), ...Object.keys(action.new.tags)]);
  let sortedKeys = Array.from(allKeys).sort();

  if (sortedKeys.length > 0) {
    htmlContent += "<table>";
    htmlContent += `
      <thead>
        <tr>
          <th>Tag</th>
          <th>Value</th>
        </tr>
      </thead>
    `;

    for (let key of sortedKeys) {
      let oldval = action.old ? action.old.tags[key] : undefined;
      let newval = action.new ? action.new.tags[key] : undefined;

      if (oldval === newval) {
        htmlContent += `
          <tr>
            <td>${key}</td>
            <td>${newval}</td>
          </tr>
        `;
      } else if (oldval === undefined) {
        htmlContent += `
          <tr class="create">
            <td>${key}</td>
            <td>${newval}</td>
          </tr>
        `;
      } else if (newval === undefined) {
        htmlContent += `
          <tr class="delete">
            <td>${key}</td>
            <td>${oldval}</td>
          </tr>
        `;
      } else {
        htmlContent += `
          <tr class="modify">
            <td>${key}</td>
            <td>
              <del>${oldval}</del> → <ins>${newval}</ins>
            </td>
          </tr>
        `;
      }
    }
    htmlContent += "</table>";
  } else {
    htmlContent += "<p>No tags</p>";
  }

  popup.setHTML(htmlContent);
  popup.addTo(map);
}
