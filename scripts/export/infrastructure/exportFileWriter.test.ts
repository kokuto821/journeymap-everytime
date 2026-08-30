import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// writeExportFiles(params: {
//   relativePaths: string[];
//   worldRootDir: string;
//   outputRootDir: string;
//   zMax: number;
// }): Promise<void>
//
// journeyMapFileReader.readJourneyMapFilesが返す相対パス一覧(例:
// `overworld/day/-4,3.png`, `waypoints/WaypointData.dat`)を受け取り、
// day/night/topo/biomeの各レイヤーをtileZoomPyramid.generateTileZoomPyramidへ、
// `waypoints/WaypointData.dat`が含まれる場合はwaypointConverter.convertWaypointDataToJson
// へ、全レイヤー処理完了後にtileMetadataWriter.writeTileMetadataへと束ねて委譲する
// オーケストレーション層(インフラ層)。
//
// backend専用のテスト規約(test-rule.mdのバックエンド版)はまだ整備されていないため、
// 対象言語(TypeScript)・テストフレームワーク(Vitest)における一般的な作法(AAA・命名・
// 分割、およびvi.mockによる依存モジュールの分離)に従って実装する。
//
// generateTileZoomPyramid・convertWaypointDataToJson・writeTileMetadataはいずれも
// 実ファイル生成・画像処理を伴い実行コストが高いため、いずれもvi.mockで置き換え、
// 統合層(exportFileWriter)が正しい引数・順序・条件で各モジュールを呼び出しているかを
// 検証する単体テストとする(実ファイルシステムは使わない。waypointファイルの読み込み・
// 出力に使うfs.readFileSync/fs.writeFileSyncもモック化する)。
//
// 出力先ディレクトリの作成は各既存モジュール(generateTileZoomPyramid・
// writeTileMetadata)が自前でmkdirSyncする契約のため、統合層(exportFileWriter)は
// ディレクトリ作成に関与しない(このテストのスコープ外)。

type GenerateTileZoomPyramidCallArgs = {
  layer: string;
  zMax: number;
  regionTiles: { x: number; y: number; filePath: string }[];
  outputRootDir: string;
};

const { generateTileZoomPyramidMock, convertWaypointDataToJsonMock, writeTileMetadataMock } =
  vi.hoisted(() => ({
    generateTileZoomPyramidMock: vi.fn(),
    convertWaypointDataToJsonMock: vi.fn(),
    writeTileMetadataMock: vi.fn(),
  }));

vi.mock('./tileZoomPyramid.ts', () => ({
  generateTileZoomPyramid: generateTileZoomPyramidMock,
}));

vi.mock('./waypointConverter.ts', () => ({
  convertWaypointDataToJson: convertWaypointDataToJsonMock,
}));

vi.mock('./tileMetadataWriter.ts', () => ({
  writeTileMetadata: writeTileMetadataMock,
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Redフェーズ: exportFileWriter.tsはまだ存在しないため、このimportによりテストは失敗する。
import { writeExportFiles } from './exportFileWriter.ts';

const WORLD_ROOT_DIR = '/world';
const OUTPUT_ROOT_DIR = '/output';
const Z_MAX = 8;

/**
 * 指定レイヤーで呼ばれたgenerateTileZoomPyramidの呼び出し引数を1件取り出す
 * (見つからない場合は`undefined`。そのレイヤーが呼ばれなかったことの検証に使う)。
 */
function findGenerateTileZoomPyramidCallByLayer(
  layer: string,
): GenerateTileZoomPyramidCallArgs | undefined {
  return generateTileZoomPyramidMock.mock.calls.find(
    ([params]: [GenerateTileZoomPyramidCallArgs]) => params.layer === layer,
  )?.[0];
}

describe('writeExportFiles', () => {
  beforeEach(() => {
    generateTileZoomPyramidMock.mockReset();
    convertWaypointDataToJsonMock.mockReset();
    writeTileMetadataMock.mockReset();
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockReset();

    generateTileZoomPyramidMock.mockResolvedValue({ minZoom: 0 });
  });

  test('day/night/topo/biomeの相対パスを渡したら各レイヤーごとに正しいregionTilesでgenerateTileZoomPyramidが呼ばれる', async () => {
    // Arrange
    const relativePaths = [
      'overworld/day/-4,3.png',
      'overworld/day/0,10.png',
      'overworld/night/0,10.png',
      'overworld/topo/12,-34.png',
      'overworld/biome/-1,-1.png',
    ];

    // Act
    await writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });

    // Assert
    expect(findGenerateTileZoomPyramidCallByLayer('day')).toEqual({
      layer: 'day',
      zMax: Z_MAX,
      regionTiles: [
        { x: -4, y: 3, filePath: path.join(WORLD_ROOT_DIR, 'overworld/day/-4,3.png') },
        { x: 0, y: 10, filePath: path.join(WORLD_ROOT_DIR, 'overworld/day/0,10.png') },
      ],
      outputRootDir: OUTPUT_ROOT_DIR,
    });
    expect(findGenerateTileZoomPyramidCallByLayer('night')).toEqual({
      layer: 'night',
      zMax: Z_MAX,
      regionTiles: [
        { x: 0, y: 10, filePath: path.join(WORLD_ROOT_DIR, 'overworld/night/0,10.png') },
      ],
      outputRootDir: OUTPUT_ROOT_DIR,
    });
    expect(findGenerateTileZoomPyramidCallByLayer('topo')).toEqual({
      layer: 'topo',
      zMax: Z_MAX,
      regionTiles: [
        { x: 12, y: -34, filePath: path.join(WORLD_ROOT_DIR, 'overworld/topo/12,-34.png') },
      ],
      outputRootDir: OUTPUT_ROOT_DIR,
    });
    expect(findGenerateTileZoomPyramidCallByLayer('biome')).toEqual({
      layer: 'biome',
      zMax: Z_MAX,
      regionTiles: [
        { x: -1, y: -1, filePath: path.join(WORLD_ROOT_DIR, 'overworld/biome/-1,-1.png') },
      ],
      outputRootDir: OUTPUT_ROOT_DIR,
    });
  });

  test('waypoints/WaypointData.datを含めたらファイルが読み込まれconvertWaypointDataToJsonの変換結果がJSONファイルとして出力される', async () => {
    // Arrange
    const relativePaths = ['overworld/day/0,0.png', 'waypoints/WaypointData.dat'];
    const waypointBuffer = Buffer.from([0x01, 0x02]);
    const convertedWaypoints = { home: { x: 0, y: 64, z: 0 } };
    vi.mocked(fs.readFileSync).mockReturnValue(waypointBuffer);
    convertWaypointDataToJsonMock.mockReturnValue(convertedWaypoints);

    // Act
    await writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });

    // Assert
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(WORLD_ROOT_DIR, 'waypoints/WaypointData.dat'),
    );
    expect(convertWaypointDataToJsonMock).toHaveBeenCalledWith(waypointBuffer);
    const writeFileSyncCall = vi
      .mocked(fs.writeFileSync)
      .mock.calls.find(([filePath]) => String(filePath).endsWith('waypoints.json'));
    expect(writeFileSyncCall).toBeDefined();
    expect(String(writeFileSyncCall?.[0])).toBe(path.join(OUTPUT_ROOT_DIR, 'waypoints.json'));
    expect(JSON.parse(String(writeFileSyncCall?.[1]))).toEqual(convertedWaypoints);
  });

  test('waypoints/WaypointData.datが走査結果に含まれなかったらconvertWaypointDataToJsonが呼ばれない', async () => {
    // Arrange
    const relativePaths = ['overworld/day/0,0.png'];

    // Act
    await writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });

    // Assert
    expect(convertWaypointDataToJsonMock).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('全レイヤーのgenerateTileZoomPyramidが解決してからwriteTileMetadataが呼ばれる', async () => {
    // Arrange
    const relativePaths = ['overworld/day/0,0.png', 'overworld/night/0,0.png'];
    let resolveDay: ((value: { minZoom: number }) => void) | undefined;
    let resolveNight: ((value: { minZoom: number }) => void) | undefined;
    const dayPromise = new Promise<{ minZoom: number }>((resolve) => {
      resolveDay = resolve;
    });
    const nightPromise = new Promise<{ minZoom: number }>((resolve) => {
      resolveNight = resolve;
    });
    generateTileZoomPyramidMock.mockImplementation(({ layer }: GenerateTileZoomPyramidCallArgs) =>
      layer === 'day' ? dayPromise : nightPromise,
    );

    // Act
    // 非同期の解決タイミングを制御して順序を検証するテストのため、
    // 例外的に複数ステップ(2つのPromiseを段階的に解決)を1テストで行う。
    const resultPromise = writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(writeTileMetadataMock).not.toHaveBeenCalled();

    resolveDay?.({ minZoom: 1 });
    await Promise.resolve();
    await Promise.resolve();
    expect(writeTileMetadataMock).not.toHaveBeenCalled();

    resolveNight?.({ minZoom: 1 });
    await resultPromise;
    expect(writeTileMetadataMock).toHaveBeenCalledTimes(1);
  });

  test('レイヤーごとに異なるminZoomが返されたらwriteTileMetadataにはその最小値が渡される', async () => {
    // Arrange
    const relativePaths = ['overworld/day/0,0.png', 'overworld/night/0,0.png'];
    generateTileZoomPyramidMock.mockImplementation(({ layer }: GenerateTileZoomPyramidCallArgs) =>
      Promise.resolve({ minZoom: layer === 'day' ? 5 : 3 }),
    );

    // Act
    await writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });

    // Assert
    expect(writeTileMetadataMock).toHaveBeenCalledWith(expect.objectContaining({ minZoom: 3 }));
  });

  test('あるレイヤーの対象ファイルが0件だったらそのレイヤーについてgenerateTileZoomPyramidが呼ばれない', async () => {
    // Arrange
    const relativePaths = [
      'overworld/day/0,0.png',
      'overworld/night/0,0.png',
      'overworld/topo/0,0.png',
    ];

    // Act
    await writeExportFiles({
      relativePaths,
      worldRootDir: WORLD_ROOT_DIR,
      outputRootDir: OUTPUT_ROOT_DIR,
      zMax: Z_MAX,
    });

    // Assert
    expect(findGenerateTileZoomPyramidCallByLayer('biome')).toBeUndefined();
    expect(findGenerateTileZoomPyramidCallByLayer('day')).toBeDefined();
    expect(findGenerateTileZoomPyramidCallByLayer('night')).toBeDefined();
    expect(findGenerateTileZoomPyramidCallByLayer('topo')).toBeDefined();
    expect(writeTileMetadataMock).toHaveBeenCalledTimes(1);
  });

  test('いずれかのレイヤーでgenerateTileZoomPyramidが例外を投げたら呼び出し元に伝播する', async () => {
    // Arrange
    const relativePaths = ['overworld/day/0,0.png'];
    const error = new Error('tile pyramid failure');
    generateTileZoomPyramidMock.mockRejectedValue(error);

    // Act & Assert
    await expect(
      writeExportFiles({
        relativePaths,
        worldRootDir: WORLD_ROOT_DIR,
        outputRootDir: OUTPUT_ROOT_DIR,
        zMax: Z_MAX,
      }),
    ).rejects.toThrow(error);
  });

  test('convertWaypointDataToJsonが例外を投げたら呼び出し元に伝播する', async () => {
    // Arrange
    const relativePaths = ['waypoints/WaypointData.dat'];
    const error = new Error('waypoint conversion failure');
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from([]));
    convertWaypointDataToJsonMock.mockImplementation(() => {
      throw error;
    });

    // Act & Assert
    await expect(
      writeExportFiles({
        relativePaths,
        worldRootDir: WORLD_ROOT_DIR,
        outputRootDir: OUTPUT_ROOT_DIR,
        zMax: Z_MAX,
      }),
    ).rejects.toThrow(error);
  });
});
