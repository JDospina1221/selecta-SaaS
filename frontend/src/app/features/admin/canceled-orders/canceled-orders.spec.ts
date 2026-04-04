import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanceledOrders } from './canceled-orders';

describe('CanceledOrders', () => {
  let component: CanceledOrders;
  let fixture: ComponentFixture<CanceledOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanceledOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(CanceledOrders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
