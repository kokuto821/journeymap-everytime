import { screen } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * 指定した名前のボタンのaria-pressedが期待値であることを検証するヘルパー
 */
export const expectButtonPressed = (name: string, pressed: boolean) => {
  expect(screen.getByRole('button', { name })).toHaveAttribute(
    'aria-pressed',
    String(pressed),
  );
};
