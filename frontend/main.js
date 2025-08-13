import maplibre from "maplibre-gl";
import adiffParser from "@osmcha/osm-adiff-parser";
import { MapLibreAugmentedDiffViewer } from "@osmcha/maplibre-adiff-viewer";
import htm from 'htm/mini';
import h from 'vhtml';

const html = htm.bind(h);

let container = document.querySelector("main");
let shouldJumpToBounds = window.location.hash === "";

// Wait for DOM to be fully loaded and styled before initializing map
await new Promise(resolve => {
  if (document.readyState === 'complete') {
    resolve();
  } else {
    window.addEventListener('load', resolve);
  }
});

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
    adiffViewer.deselect();
    return;
  }

  let element = action.new ?? action.old;
  adiffViewer.select(element.type, element.id);

  let popup = new maplibre.Popup();
  popup.setMaxWidth(null);
  popup.setLngLat(event.lngLat);

  const content = PopupContent({ action });
  popup.setHTML(content);
  popup.addTo(map);
}

function PopupContent({ action }) {
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

  return html`
    <>
      <p><strong>${action.new.type}/${action.new.id}</strong>${verb && " was " + verb}</p>
      ${TagsTable({ action })}
      ${action.new.type === 'relation' ? RelationMembersTable({ action }) : null}
    </>
  `;
}

function TagsTable({ action }) {
  let allKeys;
  if (action.type === 'create') {
    allKeys = new Set(Object.keys(action.new.tags));
  } else {
    allKeys = new Set([
      ...Object.keys(action.old.tags),
      ...Object.keys(action.new.tags)
    ]);
  }
  let sortedKeys = Array.from(allKeys).sort();

  if (sortedKeys.length > 0) {
    return html`
      <table>
        <thead>
          <tr>
            <th>Tag</th>
            <th>Value</th>
          </tr>
        </thead>
        ${sortedKeys.map(key => {
          const oldval = action.old ? action.old.tags[key] : undefined;
          const newval = action.new ? action.new.tags[key] : undefined;

          if (oldval === newval) {
            return html`
              <tr>
                <td>${key}</td>
                <td>${newval}</td>
              </tr>
            `;
          } else if (oldval === undefined) {
            return html`
              <tr class="create">
                <td>${key}</td>
                <td>${newval}</td>
              </tr>
            `;
          } else if (newval === undefined) {
            return html`
              <tr class="delete">
                <td>${key}</td>
                <td>${oldval}</td>
              </tr>
            `;
          } else {
            return html`
              <tr class="modify">
                <td>${key}</td>
                <td>
                  <del>${oldval}</del> → <ins>${newval}</ins>
                </td>
              </tr>
            `;
          }
        })}
      </table>
    `;
  } else {
    return html`<p>No tags</p>`;
  }
}

function RelationMembersTable({ action }) {
  let allMembers;

  if (action.type === 'create') {
    allMembers = action.new.members;
  } else {
    allMembers = [...action.old.members, ...action.new.members];
  }

  let allMemberIds = new Set(allMembers.map(m => `${m.type}/${m.ref}`));
  allMemberIds = [...allMemberIds].sort();

  return html`
    <table class="member-table">
      <thead>
        <tr>
          <th>Member</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        ${allMemberIds.map(id => {
          const [type, ref] = id.split('/');
          const oldMember = action.old?.members.find(
            m => m.type === type && m.ref === +ref
          );
          const newMember = action.new?.members.find(
            m => m.type === type && m.ref === +ref
          );
          const oldrole = oldMember?.role;
          const newrole = newMember?.role;

          if (oldrole === newrole) {
            return html`
              <tr>
                <td>${id}</td>
                <td>${newrole}</td>
              </tr>
            `;
          } else if (oldrole === undefined) {
            return html`
              <tr class="create">
                <td>${id}</td>
                <td>${newrole}</td>
              </tr>
            `;
          } else if (newrole === undefined) {
            return html`
              <tr class="delete">
                <td>${id}</td>
                <td>${oldrole}</td>
              </tr>
            `;
          } else {
            return html`
              <tr class="modify">
                <td>${id}</td>
                <td>
                  <del>${oldrole}</del> → <ins>${newrole}</ins>
                </td>
              </tr>
            `;
          }
        })}
      </tbody>
    </table>
  `;
}
