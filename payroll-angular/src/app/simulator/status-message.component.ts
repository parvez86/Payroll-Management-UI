

import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-status-message',
  standalone: true,
  imports: [NgIf],
  template: '<div *ngIf="message" class="status-message">{{ message }}</div>'
})
export class StatusMessageComponent {
  @Input() message: string = '';
}
