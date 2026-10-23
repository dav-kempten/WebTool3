import { HttpErrorResponse } from '@angular/common/http';
import { describeSaveErrors, toSaveError } from './save-error';

function failed(body: unknown, status = 400) {
  return toSaveError(new HttpErrorResponse({ error: body, status }));
}

describe('describeSaveErrors', () => {
  it('passes on what the backend says about a full booking code space', () => {
    // The exact body POST /api/frontend/tours/ returns once a category is full.
    const { errors } = failed({
      reference: 'Alle 990 Buchungscodes der Kategorie "BGT" sind in Saison 2026 vergeben.',
    });
    expect(describeSaveErrors(errors, 'Fallback')).toBe(
      'Buchungscode: Alle 990 Buchungscodes der Kategorie "BGT" sind in Saison 2026 vergeben.',
    );
  });

  it('shows a bare error list without a field label', () => {
    const { errors } = failed(['Tour needs a category for creation']);
    expect(describeSaveErrors(errors, 'Fallback')).toBe('Tour needs a category for creation');
  });

  it('falls back when the response carries nothing readable', () => {
    expect(describeSaveErrors(failed(null, 500).errors, 'Bitte erneut versuchen.')).toBe(
      'Bitte erneut versuchen.',
    );
  });
});
