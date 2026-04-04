import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersManager } from './orders-manager';

describe('OrdersManager', () => {
  let component: OrdersManager;
  let fixture: ComponentFixture<OrdersManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersManager],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
