import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LayerType } from '../../domain/layer/LayerType';
import { getR2BaseUrl } from '../../infrastructure/config/env';
import { fetchTileMetadata } from '../../infrastructure/tile/tileMetadataProvider';
import { createGameMapCrs } from './gameMapCrs';
import { LayerSwitcher } from '../LayerSwitcher/LayerSwitcher';
import { MapErrorModal } from '../MapErrorModal/MapErrorModal';
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

// JourneyMapのワールド座標原点(worldX=0, worldZ=0)を地図の初期中心にする。
const MAP_CENTER_LAT = 0;
const MAP_CENTER_LNG = 0;
const MAP_CENTER: [number, number] = [MAP_CENTER_LAT, MAP_CENTER_LNG];

/**
 * metadata.json取得後に組み立てる地図本体。
 * CRSはzMax確定後でないと正しく組み立てられないため、MapView側でloaded後のみ描画する。
 */
const MapCanvas = ({ zMax, minZoom, tileSize }: MapCanvasProps) => {
  const style = { canvas: 'absolute inset-0' };
  const [layerType, setLayerType] = useState<LayerType>('day');
  const tileUrl = useTileLayerUrl(layerType);
  const crs = createGameMapCrs(zMax);

  return (
    <>
      <MapContainer
        className={style.canvas}
        crs={crs}
        center={MAP_CENTER}
        zoom={minZoom}
        minZoom={minZoom}
        maxZoom={zMax}
      >
        <TileLayer url={tileUrl} tileSize={tileSize} noWrap errorTileUrl={TRANSPARENT_TILE_URL} />
      </MapContainer>
      <LayerSwitcher value={layerType} onChange={setLayerType} />
    </>
  );
};

/**
 * R2上のmetadata.jsonを取得し、結果に応じたMapMetadataStateを返す。
 * getR2BaseUrl()の同期throwもfetchTileMetadata()の失敗も同じcatchで扱うため、
 * baseUrlの取得自体もPromiseチェーンの中で行う。
 */
const loadMapMetadata = (): Promise<MapMetadataState> =>
  Promise.resolve()
    .then(() => getR2BaseUrl())
    .then((baseUrl) => fetchTileMetadata(baseUrl))
    .then((metadata): MapMetadataState => ({
      status: 'loaded',
      zMax: metadata.zMax,
      minZoom: metadata.minZoom,
      tileSize: metadata.tileSize,
    }))
    .catch((): MapMetadataState => ({ status: 'error' }));

/** S-01地図ビュー画面。R2上のmetadata.jsonを取得し、初期レイヤー(昼)のタイルを表示する。 */
export const MapView = () => {
  const [state, setState] = useState<MapMetadataState>({ status: 'loading' });
  const [isRetrying, setIsRetrying] = useState(false);
  // 再試行の連打で古い結果が新しい結果を上書きしないよう、最新の呼び出しのみ識別するトークン。
  const retryTokenRef = useRef<object | null>(null);

  useEffect(() => {
    const cancelledRef = { current: false };

    loadMapMetadata().then((nextState) => {
      if (!cancelledRef.current) {
        setState(nextState);
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <p role="status">地図データを読み込み中...</p>;
  }

  /**
   * 再試行を呼ぶたびに新しいトークンを発行し、retryTokenRef.currentに保持する。
   * loadMapMetadata()の応答時にトークンが一致する場合(＝直近の呼び出しである場合)のみ
   * state・isRetryingへ反映する。連打で古い応答が新しい応答を上書きするのを防ぐ。
   */
  const handleRetry = () => {
    const retryToken = {};
    retryTokenRef.current = retryToken;
    setIsRetrying(true);

    loadMapMetadata().then((nextState) => {
      if (retryTokenRef.current === retryToken) {
        setState(nextState);
        setIsRetrying(false);
      }
    });
  };

  if (state.status === 'error') {
    return <MapErrorModal onRetry={handleRetry} isRetrying={isRetrying} />;
  }

  return <MapCanvas zMax={state.zMax} minZoom={state.minZoom} tileSize={state.tileSize} />;
};
