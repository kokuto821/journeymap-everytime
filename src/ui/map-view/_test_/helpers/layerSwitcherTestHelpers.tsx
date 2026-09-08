import { render, screen } from '@testing-library/react';
import { expect, vi } from 'vitest';
import type { LayerType } from '../../../../domain/layer/LayerType';
import { LayerSwitcher } from '../../LayerSwitcher';

/** LayerSwitcherを描画し、onChangeモックを返す。valueは既定で'day'。 */
export function renderLayerSwitcher(value: LayerType = 'day') {
  const onChange = vi.fn();
  render(<LayerSwitcher value={value} onChange={onChange} />);
  return { onChange };
}

/** 指定ラベルのレイヤー選択ボタンのaria-checkedを検証する。 */
export function expectLayerChecked(label: string, checked: boolean) {
  expect(screen.getByRole('radio', { name: label })).toHaveAttribute(
    'aria-checked',
    String(checked),
  );
}
