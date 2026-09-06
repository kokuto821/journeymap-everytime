import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getR2BaseUrl } from '../../infrastructure/config/env';
import { fetchTileMetadata } from '../../infrastructure/tile/tileMetadataProvider';
import { createGameMapCrs } from './gameMapCrs';
import { useTileLayerUrl } from './useTileLayerUrl';

const TILE_SIZE = 512;
// 未探索領域(タイル404)を空白表示にするための透明1x1px PNG。エラー画面は出さない方針(design.md F-001節)。
const TRANSPARENT_TILE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

type MapMetadataState =
  { status: 'loading' } | { status: 'loaded'; zMax: number; minZoom: number } | { status: 'error' };

type MapCanvasProps = {
  zMax: number;
  minZoom: number;
};

/**
 * metadata.json取得後に組み立てる地図本体。
 * CRSはzMax確定後でないと正しく組み立てられないため、MapView側でloaded後のみ描画する。
 */
function MapCanvas({ zMax, minZoom }: MapCanvasProps) {
  const tileUrl = useTileLayerUrl('day');
  const crs = createGameMapCrs(zMax);

  return (
    <MapContainer crs={crs} center={[0, 0]} zoom={minZoom} minZoom={minZoom} maxZoom={zMax}>
      <TileLayer url={tileUrl} tileSize={TILE_SIZE} noWrap errorTileUrl={TRANSPARENT_TILE_URL} />
    </MapContainer>
  );
}

/** S-01地図ビュー画面。R2上のmetadata.jsonを取得し、初期レイヤー(昼)のタイルを表示する。 */
export function MapView() {
  const [state, setState] = useState<MapMetadataState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchTileMetadata(getR2BaseUrl())
      .then((metadata) => {
        if (!cancelled) {
          setState({ status: 'loaded', zMax: metadata.zMax, minZoom: metadata.minZoom });
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

  return <MapCanvas zMax={state.zMax} minZoom={state.minZoom} />;
}
