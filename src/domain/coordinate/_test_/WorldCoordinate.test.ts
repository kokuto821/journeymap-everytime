import { describe, expect, test } from 'vitest';
import { createWorldCoordinate } from '../WorldCoordinate';

describe('createWorldCoordinate', () => {
  test('正常な整数x/zで生成できたら値を保持する', () => {
    // Arrange
    const x = 5;
    const z = -3;

    // Act
    const result = createWorldCoordinate({ x, z });

    // Assert
    expect(result.x).toBe(x);
    expect(result.z).toBe(z);
  });

  test('xが非整数だとErrorをthrowする', () => {
    // Act
    const act = () => createWorldCoordinate({ x: 1.5, z: 0 });

    // Assert
    expect(act).toThrow();
  });

  test('zが非整数だとErrorをthrowする', () => {
    // Act
    const act = () => createWorldCoordinate({ x: 0, z: 1.5 });

    // Assert
    expect(act).toThrow();
  });

  test('同じx/zのWorldCoordinate同士でequalsを呼んだらtrueを返す', () => {
    // Arrange
    const a = createWorldCoordinate({ x: 2, z: -1 });
    const b = createWorldCoordinate({ x: 2, z: -1 });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  test('異なるx/zのWorldCoordinate同士でequalsを呼んだらfalseを返す', () => {
    // Arrange
    const a = createWorldCoordinate({ x: 2, z: -1 });
    const b = createWorldCoordinate({ x: 3, z: -1 });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });
});
