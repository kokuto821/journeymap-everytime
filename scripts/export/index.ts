import 'dotenv/config';

// F-004 エクスポートスクリプトのエントリファイル。
// exportTargetPolicy(ドメイン層)・journeyMapFileReader/exportFileWriter(インフラ層)は
// 後続タスクで実装する。現時点では設定・雛形のみの器で、ロジックは持たない。
console.log('export:map-data は未実装です(issue#18 後続タスクで実装予定)');
console.log(`JOURNEYMAP_WORLD_DATA_PATH=${process.env.JOURNEYMAP_WORLD_DATA_PATH ?? '(未設定)'}`);
