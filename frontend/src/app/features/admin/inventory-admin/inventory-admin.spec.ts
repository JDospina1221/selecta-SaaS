import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryAdmin } from './inventory-admin';

describe('InventoryAdmin', () => {
  let component: InventoryAdmin;
  let fixture: ComponentFixture<InventoryAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
