import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the dashboard loading state', () => {
  render(<App />);
  expect(screen.getByText(/Loading Vision 2030 Health Dashboard/i)).toBeInTheDocument();
});
