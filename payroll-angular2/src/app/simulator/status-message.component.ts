import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-message',
  template: `<div class="status-message" [ngClass]="type">{{ message }}</div>`,
  styles: [`.status-message { padding: 0.5rem 1rem; border-radius: 4px; margin: 0.5rem 0; font-weight: 500; }
    .success { background: #e6fffa; color: #2c7a7b; }
    .error { background: #fff5f5; color: #c53030; }
    .info { background: #ebf8ff; color: #2b6cb0; }`]
})
export class StatusMessageComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
}
