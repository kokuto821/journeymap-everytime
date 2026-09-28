import { useState } from 'react';
import { useMapEvent } from 'react-leaflet';
import { convertLatLngToWorldCoordinate } from '../../domain/coordinate/convertLatLngToWorldCoordinate';
import type { WorldCoordinate } from '../../domain/coordinate/WorldCoordinate';

export type UseMapCoordinateResult = {
  /** 地図上で最後にクリックされた地点のワールド座標。クリック前はnull */
  coordinate: WorldCoordinate | null;
};

/**
 * 地図クリック地点の座標を保持するフック。
 * クリックイベントの座標変換はdomain層(convertLatLngToWorldCoordinate)に委譲し、本フックはstate管理のみを担う。
 * react-leafletのuseMapEventを使うため、MapContainer配下でのみ利用できる。
 */
export const useMapCoordinate = (): UseMapCoordinateResult => {
  const [coordinate, setCoordinate] = useState<WorldCoordinate | null>(null);

  useMapEvent('click', (event) => {
    setCoordinate(convertLatLngToWorldCoordinate(event.latlng, event.target.getZoom()));
  });

  return { coordinate };
};
