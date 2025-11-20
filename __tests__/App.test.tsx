/**
 * @format
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renderiza sem crash', async () => {
    const { root } = render(<App />);
    
    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });
});
