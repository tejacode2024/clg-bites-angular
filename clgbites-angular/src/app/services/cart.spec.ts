import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty cart', () => {
    expect(service.totalItems()).toBe(0);
    expect(service.totalAmount()).toBe(0);
  });

  it('should add items to cart', () => {
    const mockItem = { name: 'Test Item', price: 100 };
    const mockRestaurant: any = { id: 'test-restaurant', name: 'Test Restaurant', image: '', rating: 4, description: '', categories: [], bestItem: '', menu: [] };
    service.addItem(mockItem, mockRestaurant);
    expect(service.totalItems()).toBe(1);
    expect(service.totalAmount()).toBe(100);
  });
});
