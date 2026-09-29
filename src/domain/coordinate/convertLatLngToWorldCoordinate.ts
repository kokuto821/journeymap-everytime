import type L from 'leaflet';
import { createWorldCoordinate, type WorldCoordinate } from './WorldCoordinate';

/**
 * LeafletのLatLngをWorldCoordinateへ変換する。
 * 本アプリのCRS(gameMapCrs)はlatlngとワールド座標が1:1対応するため、zoomは結果に影響しない。
 */
export const convertLatLngToWorldCoordinate = (latlng: L.LatLng): WorldCoordinate => {
  return createWorldCoordinate({
    x: Math.floor(latlng.lng),
    z: Math.floor(latlng.lat),
  });
};
