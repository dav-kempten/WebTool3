import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { filenameOf } from './printout.service';

function response(disposition?: string): HttpResponse<Blob> {
  const headers = disposition ? new HttpHeaders({ 'Content-Disposition': disposition }) : new HttpHeaders();
  return new HttpResponse({ body: new Blob(['%PDF']), headers });
}

describe('filenameOf', () => {
  it('takes the name the backend gives the printout', () => {
    expect(filenameOf(response('attachment; filename="BGT-701_2027-07-10.pdf"'), 'Tour-1.pdf')).toBe(
      'BGT-701_2027-07-10.pdf',
    );
  });

  it('falls back when the header is missing', () => {
    expect(filenameOf(response(), 'Kurs-7.pdf')).toBe('Kurs-7.pdf');
  });
});
