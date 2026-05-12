import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  test('renders logo and navigation links', () => {
    render(<Sidebar />);

    // Check logo
    expect(screen.getByText(/EduTrack/i)).toBeInTheDocument();

    // Check links
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Materias/i)).toBeInTheDocument();
    expect(screen.getByText(/Test/i)).toBeInTheDocument();
    expect(screen.getByText(/Asistente/i)).toBeInTheDocument();
  });
});
