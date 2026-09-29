import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapContainer } from 'react-leaflet';
import { describe, expect, test } from 'vitest';
import { useMapCoordinate } from '../useMapCoordinate';

const INITIAL_CENTER_LAT = 0;
const INITIAL_CENTER_LNG = 0;
const INITIAL_CENTER: [number, number] = [INITIAL_CENTER_LAT, INITIAL_CENTER_LNG];
const INITIAL_ZOOM = 0;

/** useMapCoordinateはMapContainer配下(react-leafletのuseMapEvent)でのみ動作するため、実描画したMapContainer経由で結果を取得する。 */
const renderUseMapCoordinate = () => {
  let hookResult: ReturnType<typeof useMapCoordinate> | undefined;

  const HookProbe = () => {
    hookResult = useMapCoordinate();
    return null;
  };

  render(
    <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} style={{ height: '100px', width: '100px' }}>
      <HookProbe />
    </MapContainer>,
  );

  return {
    getResult: () => {
      if (!hookResult) {
        throw new Error('useMapCoordinateの結果が取得できませんでした');
      }
      return hookResult;
    },
  };
};

describe('useMapCoordinate', () => {
  test('初期状態ではclickedWorldCoordinateがnullである', async () => {
    // Arrange & Act
    const { getResult } = renderUseMapCoordinate();

    // Assert
    await waitFor(() => {
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
    });
    expect(getResult().clickedWorldCoordinate).toBeNull();
  });

  test('地図クリックしたらconvertLatLngToWorldCoordinateの変換結果がclickedWorldCoordinateにセットされる', async () => {
    // Arrange
    const user = userEvent.setup();
    const { getResult } = renderUseMapCoordinate();
    await waitFor(() => {
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
    });
    const container = document.querySelector<HTMLElement>('.leaflet-container');
    if (!container) {
      throw new Error('leaflet-containerが見つかりませんでした');
    }

    // Act
    await user.click(container);

    // Assert
    await waitFor(() => {
      expect(getResult().clickedWorldCoordinate).not.toBeNull();
    });
    expect(getResult().clickedWorldCoordinate?.x).toStrictEqual(expect.any(Number));
    expect(getResult().clickedWorldCoordinate?.z).toStrictEqual(expect.any(Number));
  });
});
