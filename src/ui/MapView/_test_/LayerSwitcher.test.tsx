import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { expectLayerChecked, renderLayerSwitcher } from './helpers/layerSwitcherTestHelpers';

describe('LayerSwitcher', () => {
  test('描画したら現在選択中のレイヤーがaria-checked=trueになる', () => {
    // Act
    renderLayerSwitcher('day');

    // Assert
    expectLayerChecked('昼', true);
    expectLayerChecked('夜', false);
    expectLayerChecked('地形', false);
    expectLayerChecked('バイオーム', false);
  });

  test.each([
    { label: '夜', expected: 'night' },
    { label: '地形', expected: 'topo' },
    { label: 'バイオーム', expected: 'biome' },
  ])('$labelのボタンを押したらonChangeに$expectedが渡される', async ({ label, expected }) => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderLayerSwitcher('day');

    // Act
    await user.click(screen.getByRole('radio', { name: label }));

    // Assert
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  test('選択中のボタンで右矢印キーを押したらonChangeに次のレイヤーが渡される', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderLayerSwitcher('day');
    screen.getByRole('radio', { name: '昼' }).focus();

    // Act
    await user.keyboard('{ArrowRight}');

    // Assert
    expect(onChange).toHaveBeenCalledWith('night');
  });

  test('選択中のボタンで左矢印キーを押したらonChangeに前のレイヤーが渡される', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderLayerSwitcher('day');
    screen.getByRole('radio', { name: '昼' }).focus();

    // Act
    await user.keyboard('{ArrowLeft}');

    // Assert
    expect(onChange).toHaveBeenCalledWith('biome');
  });

  test('非選択のボタンはtabIndexが-1になる', () => {
    // Act
    renderLayerSwitcher('day');

    // Assert
    expect(screen.getByRole('radio', { name: '昼' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('radio', { name: '夜' })).toHaveAttribute('tabIndex', '-1');
  });
});
