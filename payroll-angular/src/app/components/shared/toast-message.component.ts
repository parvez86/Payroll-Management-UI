import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <div class="toast toast-info">
        <p>{{ message() }}</p>
        <button (click)="onClose()" class="toast-close">✕</button>
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    .toast-info {
      border-left: 4px solid #3b82f6;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      line-height: 1;
    }

    .toast-close:hover {
      color: #374151;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastMessageComponent {
  message = input<string>('');
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}
