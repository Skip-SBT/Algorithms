import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the maze controls', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/seconds/i)).toBeInTheDocument();
});
