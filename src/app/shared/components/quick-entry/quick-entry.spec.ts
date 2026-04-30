import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickEntry } from './quick-entry';

describe('QuickEntry', () => {
  let component: QuickEntry;
  let fixture: ComponentFixture<QuickEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickEntry],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
