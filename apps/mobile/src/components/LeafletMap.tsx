import React, { useMemo, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  color: string;
  pulse?: boolean;
  /** Shown as a label beside the pin (e.g. a shelter name). */
  label?: string;
}

interface LeafletMapProps {
  pins?: MapPin[];
  center: { lat: number; lng: number };
  zoom?: number;
  /** A single draggable/tappable marker, for location-picking screens. */
  draggableMarker?: { lat: number; lng: number; color?: string };
  interactive?: boolean;
  /** Frame the map around all pins instead of holding `center`. */
  fitToPins?: boolean;
  onPinPress?: (id: string) => void;
  onMapPress?: (coords: { lat: number; lng: number }) => void;
  onDraggableMarkerMove?: (coords: { lat: number; lng: number }) => void;
  style?: StyleProp<ViewStyle>;
}

// A WebView + Leaflet + OpenStreetMap map — no map SDK, account, or API key
// needed anywhere (unlike Mapbox/Google Maps). Leaflet itself is loaded from
// a CDN inside the WebView's sandboxed page, which is a normal, well-tested
// pattern for React Native and unrelated to any artifact/CDN restrictions.
export function LeafletMap({
  pins = [],
  center,
  zoom = 14,
  draggableMarker,
  interactive = true,
  fitToPins = false,
  onPinPress,
  onMapPress,
  onDraggableMarkerMove,
  style,
}: LeafletMapProps) {
  const webviewRef = useRef<WebView>(null);

  // Built once: rebuilding the HTML would reload every tile. Recentering is
  // pushed into the live page below instead.
  const html = useMemo(() => buildHtml({ center, zoom, interactive }), []);

  // Push pin/marker updates into the already-loaded page instead of
  // reloading the WebView, so filtering/realtime updates don't flicker.
  // The initial center is captured in the HTML above, which is built before
  // GPS resolves — so without this the map stayed on the fallback location
  // even once the device's real position arrived.
  React.useEffect(() => {
    webviewRef.current?.injectJavaScript(
      `window.ppSetCenter && window.ppSetCenter(${center.lat}, ${center.lng}); true;`,
    );
  }, [center.lat, center.lng]);

  const pinsKey = JSON.stringify(pins);
  const markerKey = JSON.stringify(draggableMarker ?? null);
  React.useEffect(() => {
    webviewRef.current?.injectJavaScript(
      `window.ppSetPins && window.ppSetPins(${pinsKey}, ${fitToPins}); true;`,
    );
  }, [pinsKey, fitToPins]);
  React.useEffect(() => {
    webviewRef.current?.injectJavaScript(
      `window.ppSetDraggableMarker && window.ppSetDraggableMarker(${markerKey}); true;`,
    );
  }, [markerKey]);

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      style={[styles.webview, style]}
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === 'pinPress') onPinPress?.(msg.id);
          if (msg.type === 'mapPress') onMapPress?.({ lat: msg.lat, lng: msg.lng });
          if (msg.type === 'markerMove') onDraggableMarkerMove?.({ lat: msg.lat, lng: msg.lng });
        } catch {
          // ignore malformed messages
        }
      }}
      onLoadEnd={() => {
        webviewRef.current?.injectJavaScript(
          `window.ppSetPins && window.ppSetPins(${pinsKey}, ${fitToPins}); window.ppSetDraggableMarker && window.ppSetDraggableMarker(${markerKey}); true;`,
        );
      }}
    />
  );
}

function buildHtml({
  center,
  zoom,
  interactive,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  interactive: boolean;
}) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #dfe6d4; }
  .pp-pin { width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
  .pp-pin-ring { position: absolute; inset: -8px; border-radius: 50%; animation: ppPulse 1.8s ease-out infinite; }
  @keyframes ppPulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.2); opacity: 0; } }
  .pp-drag-pin { width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.25); }
  .leaflet-control-attribution { font-size: 9px; }
  .pp-label.leaflet-tooltip {
    background: #fbf6ea;
    color: #17302b;
    border: 1px solid rgba(23,48,43,0.12);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 11.5px;
    font-weight: 600;
    padding: 4px 8px;
    white-space: nowrap;
  }
  .pp-label.leaflet-tooltip::before { display: none; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', {
    zoomControl: false,
    dragging: ${interactive},
    scrollWheelZoom: ${interactive},
    doubleClickZoom: ${interactive},
    touchZoom: ${interactive},
  }).setView([${center.lat}, ${center.lng}], ${zoom});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  window.ppSetCenter = function (lat, lng) {
    map.setView([lat, lng], map.getZoom());
  };

  var pinLayer = L.layerGroup().addTo(map);
  window.ppSetPins = function (pins, fit) {
    pinLayer.clearLayers();
    (pins || []).forEach(function (p) {
      var html = '<div style="position:relative;">' +
        (p.pulse ? '<div class="pp-pin-ring" style="background:' + p.color + '55;"></div>' : '') +
        '<div class="pp-pin" style="background:' + p.color + ';"></div></div>';
      var icon = L.divIcon({ html: html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
      var marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(pinLayer);
      if (p.label) {
        marker.bindTooltip(escapeHtml(p.label), {
          permanent: true,
          direction: 'top',
          offset: [0, -12],
          className: 'pp-label',
        });
      }
      marker.on('click', function () { post({ type: 'pinPress', id: p.id }); });
    });
    // Without this the map sits on the device location, so pins in another
    // city are simply off-screen and the map looks empty.
    if (fit && pins && pins.length) {
      var bounds = L.latLngBounds(pins.map(function (p) { return [p.lat, p.lng]; }));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  var draggableMarker = null;
  window.ppSetDraggableMarker = function (m) {
    if (draggableMarker) { map.removeLayer(draggableMarker); draggableMarker = null; }
    if (!m) return;
    var icon = L.divIcon({
      html: '<div class="pp-drag-pin" style="background:' + (m.color || '#de5b3e') + ';"></div>',
      className: '', iconSize: [30, 30], iconAnchor: [15, 30],
    });
    draggableMarker = L.marker([m.lat, m.lng], { icon: icon, draggable: ${interactive} }).addTo(map);
    draggableMarker.on('dragend', function (e) {
      var pos = e.target.getLatLng();
      post({ type: 'markerMove', lat: pos.lat, lng: pos.lng });
    });
  };

  map.on('click', function (e) {
    post({ type: 'mapPress', lat: e.latlng.lat, lng: e.latlng.lng });
    if (draggableMarker) {
      draggableMarker.setLatLng(e.latlng);
      post({ type: 'markerMove', lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  webview: {
    backgroundColor: 'transparent',
  },
});
