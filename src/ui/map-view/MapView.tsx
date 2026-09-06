import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getR2BaseUrl } from '../../infrastructure/config/env';
import { fetchTileMetadata } from '../../infrastructure/tile/tileMetadataProvider';
import { createGameMapCrs } from './gameMapCrs';
import { useTileLayerUrl } from './useTileLayerUrl';

// 未探索領域(タイル404)を空白表示にするための透明1x1px PNG(RGBA全て0)。エラー画面は出さない方針(design.md F-001節)。
export const TRANSPARENT_TILE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=';

type MapMetadataState =
  | { status: 'loading' }
  | { status: 'loaded'; zMax: number; minZoom: number; tileSize: number }
  | { status: 'error' };

type MapCanvasProps = {
  zMax: number;
  minZoom: number;
  tileSize: number;
};

/**
 * metadata.json取得後に組み立てる地図本体。
 * CRSはzMax確定後でないと正しく組み立てられないため、MapView側でloaded後のみ描画する。
 */
function MapCanvas({ zMax, minZoom, tileSize }: MapCanvasProps) {
  const tileUrl = useTileLayerUrl('day');
  const crs = createGameMapCrs(zMax);

  return (
    <MapContainer
      className="map-view"
      crs={crs}
      center={[0, 0]}
      zoom={minZoom}
      minZoom={minZoom}
      maxZoom={zMax}
    >
      <TileLayer url={tileUrl} tileSize={tileSize} noWrap errorTileUrl={TRANSPARENT_TILE_URL} />
    </MapContainer>
  );
}

/** S-01地図ビュー画面。R2上のmetadata.jsonを取得し、初期レイヤー(昼)のタイルを表示する。 */
export function MapView() {
  const [state, setState] = useState<MapMetadataState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    // getR2BaseUrl()の同期throwもfetchTileMetadata()の失敗も同じcatchで扱うため、
    // baseUrlの取得自体もPromiseチェーンの中で行う。
    Promise.resolve()
      .then(() => getR2BaseUrl())
      .then((baseUrl) => fetchTileMetadata(baseUrl))
      .then((metadata) => {
        if (!cancelled) {
          setState({
            status: 'loaded',
            zMax: metadata.zMax,
            minZoom: metadata.minZoom,
            tileSize: metadata.tileSize,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <p role="status">地図データを読み込み中...</p>;
  }

  if (state.status === 'error') {
    return <p role="alert">地図データの読み込みに失敗しました</p>;
  }

  return <MapCanvas zMax={state.zMax} minZoom={state.minZoom} tileSize={state.tileSize} />;
}
