import { TestBed } from '@angular/core/testing';
import { AutoSaveService } from './auto-save.service';

interface FakeForm {
  dirty: boolean;
  valid: boolean;
  markAsPristine: () => void;
}

function makeForm(dirty: boolean, valid: boolean): FakeForm {
  return { dirty, valid, markAsPristine: vi.fn() };
}

describe('AutoSaveService', () => {
  let service: AutoSaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AutoSaveService] });
    service = TestBed.inject(AutoSaveService);
  });

  it('saves and marks pristine when the form is dirty and valid', () => {
    const form = makeForm(true, true);
    const save = vi.fn();

    service.flush({ form: () => form as never, save });

    expect(save).toHaveBeenCalledTimes(1);
    expect(form.markAsPristine).toHaveBeenCalledTimes(1);
    expect(service.lastSaved()).not.toBeNull();
  });

  it('does not save when the form is pristine', () => {
    const form = makeForm(false, true);
    const save = vi.fn();

    service.flush({ form: () => form as never, save });

    expect(save).not.toHaveBeenCalled();
    expect(service.lastSaved()).toBeNull();
  });

  it('does not save when the form is invalid', () => {
    const form = makeForm(true, false);
    const save = vi.fn();

    service.flush({ form: () => form as never, save });

    expect(save).not.toHaveBeenCalled();
  });

  it('does not save while disabled', () => {
    const form = makeForm(true, true);
    const save = vi.fn();
    service.enabled.set(false);

    service.flush({ form: () => form as never, save });

    expect(save).not.toHaveBeenCalled();
  });
});
