import { restaurants, categories } from './restaurants';

describe('Restaurants Data', () => {
  it('should have restaurants data', () => {
    expect(restaurants.length).toBeGreaterThan(0);
  });

  it('should have categories', () => {
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toBe('All');
  });
});
