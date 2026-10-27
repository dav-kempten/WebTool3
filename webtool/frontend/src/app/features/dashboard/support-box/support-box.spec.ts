import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportBox } from './support-box';
import { SupportRequest, SupportResult, SupportService } from '../../../core/services/support.service';

function create(result: SupportResult = { ok: true, detail: 'Deine Nachricht ist unterwegs.' }) {
  const sent: SupportRequest[] = [];
  TestBed.configureTestingModule({
    providers: [
      {
        provide: SupportService,
        useValue: {
          send: (request: SupportRequest) => {
            sent.push(request);
            return of(result);
          },
        },
      },
    ],
  });
  return { box: TestBed.createComponent(SupportBox).componentInstance, sent };
}

describe('SupportBox', () => {
  it('only allows sending once both fields carry text', () => {
    const { box } = create();

    expect(box.canSend()).toBe(false);
    box.subject.set('Betreff');
    expect(box.canSend()).toBe(false);
    box.message.set('Text');
    expect(box.canSend()).toBe(true);
  });

  it('treats whitespace as empty and trims what it sends', () => {
    const { box, sent } = create();

    box.subject.set('   ');
    box.message.set('  Text  ');
    expect(box.canSend()).toBe(false);

    box.subject.set('  Betreff  ');
    box.send();

    expect(sent).toEqual([{ subject: 'Betreff', message: 'Text' }]);
  });

  it('clears the form after a send so the next one starts empty', () => {
    const { box } = create();
    box.subject.set('Betreff');
    box.message.set('Text');

    box.send();

    expect(box.state()).toBe('sent');
    expect(box.subject()).toBe('');
    expect(box.message()).toBe('');
  });

  it('keeps the text when sending failed, so nothing is lost', () => {
    const { box } = create({ ok: false, detail: 'Mailserver antwortet nicht.' });
    box.subject.set('Betreff');
    box.message.set('Ein langer Text');

    box.send();

    expect(box.state()).toBe('failed');
    expect(box.feedback()).toBe('Mailserver antwortet nicht.');
    expect(box.message()).toBe('Ein langer Text');
    expect(box.canSend()).toBe(true);
  });

  it('does not send on an empty form', () => {
    const { box, sent } = create();

    box.send();

    expect(sent).toEqual([]);
    expect(box.state()).toBe('idle');
  });

  it('opens a fresh form again after a successful send', () => {
    const { box } = create();
    box.subject.set('Betreff');
    box.message.set('Text');
    box.send();

    box.reset();

    expect(box.state()).toBe('idle');
    expect(box.feedback()).toBe('');
  });
});
