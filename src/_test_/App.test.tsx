import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from '../App';

vi.mock('../ui/map-view/MapView', () => ({
  MapView: () => <div data-testid="map-view-stub" />,
}));

vi.mock('../ui/theme/ThemeSwitch', () => ({
  ThemeSwitch: () => <div data-testid="theme-switch-stub" />,
}));

describe('App', () => {
  test('アプリを描画したら地図ビューが表示される', () => {
    // Act
    render(<App />);

    // Assert
    expect(screen.getByTestId('map-view-stub')).toBeInTheDocument();
  });

  test('アプリを描画したらテーマ切替が表示される', () => {
    // Act
    render(<App />);

    // Assert
    expect(screen.getByTestId('theme-switch-stub')).toBeInTheDocument();
  });
});
