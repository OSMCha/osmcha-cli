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
        type: 'raster',
        tiles: [
          'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
          'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
          'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
          'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: 'Imagery © Microsoft Corporation',
      }
    },
    layers: [
      {
        id: 'imagery',
        type: 'raster',
        source: 'bing'
      }
    ]
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
console.log(bounds);
if (shouldJumpToBounds) {
  map.jumpTo(map.cameraForBounds(bounds, { padding: 50 }));
}

map.once("load", () => {
  adiffViewer.addTo(map);
});

function onClick(event, action) {
  console.log(action);

  let popup = new maplibre.Popup();
  popup.setMaxWidth(200);
  popup.setLngLat(event.lngLat);
  let htmlContent = ""
  htmlContent += `<h3>${action.new.type}/${action.new.id}</h3>`;

  switch (action.action) {
  case "create":
    htmlContent += `<p>created</p>`; break;
  case "modify":
    htmlContent += `<p>modified</p>`; break;
  case "delete":
    htmlContent += `<p>deleted</p>`; break;
  }
  htmlContent += "<table>";
  
  if (action.type === "modify") {
    let allKeys = [...new Set([...Object.keys(action.old.tags), ...Object.keys(action.new.tags)])].sort();
    for (let key of allKeys) {
      let oldval = action.old.tags[key] ?? "";
      let newval = action.new.tags[key] ?? "";
      
      htmlContent += `<tr><td>${key}</td>`

      if (oldval != newval) {
        let color = "rgba(232, 232, 69, 0.3)";
        if (oldval === "") {
          color = "rgba(57, 219, 192, 0.3)";
        } else if (newval === "") {
          color = "rgba(204, 44, 71, 0.3)";
        }
        htmlContent += `<td style="background: ${color}">${oldval}</td>`
        htmlContent += `<td style="background: ${color}">${newval}</td>`
      } else {
        htmlContent += `<td>${oldval}</td><td>${newval}</td>`;
      }

      htmlContent += `</tr>`
    }
    
  } else {
    let elem = action.action === "delete" ? action.old : action.new;
    for (let [key, val] of Object.entries(elem.tags)) {
      htmlContent += `<tr><td>${key}</td><td>${val}</td></tr>`;
    }
  }

  htmlContent += "</table>";
  
  popup.setHTML(htmlContent);
  popup.addTo(map);
}
