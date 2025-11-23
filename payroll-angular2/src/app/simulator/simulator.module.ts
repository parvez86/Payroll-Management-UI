import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulatorComponent } from './simulator.component';
import { StatusMessageComponent } from './status-message.component';

@NgModule({
  declarations: [SimulatorComponent, StatusMessageComponent],
  imports: [CommonModule, FormsModule],
  exports: [SimulatorComponent, StatusMessageComponent]
})
export class SimulatorModule {}
