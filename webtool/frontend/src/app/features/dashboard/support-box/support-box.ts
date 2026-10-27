import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';

type SupportState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Short line to the office straight from the dashboard. The sender, their role
 * and their address are taken from the session on the server, so the form only
 * asks for a subject and the message itself.
 */
@Component({
  selector: 'avk-support-box',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './support-box.html',
  // Dasselbe .avk-field wie in den Dialogen: Beschriftung und Feld gehören
  // zusammen und sollen hier nicht anders aussehen als anderswo im Tool.
  styleUrls: ['../../../shared/styles/create-dialog.scss', './support-box.scss'],
})
export class SupportBox {
  private auth = inject(AuthService);
  private support = inject(SupportService);

  readonly subject = signal('');
  readonly message = signal('');
  readonly state = signal<SupportState>('idle');
  readonly feedback = signal('');

  readonly user = this.auth.user;

  readonly canSend = computed(
    () =>
      this.state() !== 'sending' &&
      this.subject().trim().length > 0 &&
      this.message().trim().length > 0,
  );

  send(): void {
    if (!this.canSend()) {
      return;
    }
    this.state.set('sending');
    this.feedback.set('');
    this.support
      .send({ subject: this.subject().trim(), message: this.message().trim() })
      .subscribe((result) => {
        this.feedback.set(result.detail);
        this.state.set(result.ok ? 'sent' : 'failed');
        if (result.ok) {
          this.subject.set('');
          this.message.set('');
        }
      });
  }

  /** Lets the sender write another one after a successful send. */
  reset(): void {
    this.state.set('idle');
    this.feedback.set('');
  }
}
