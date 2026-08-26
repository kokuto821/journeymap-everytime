import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('App', () => {
  test('見出しを描画する', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Get started' })).toBeInTheDocument();
  });

  test('ボタンを押すとカウントが増える', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Count is 0' }));

    expect(screen.getByRole('button', { name: 'Count is 1' })).toBeInTheDocument();
  });
});
