import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'c-duration-range',
  templateUrl: './duration-range.component.html',
  styleUrls: ['./duration-range.component.scss']
})
export class DurationRangeComponent implements OnInit {

  @Output() setDurationRage = new EventEmitter<any>();
  
  @ViewChild('op') op!: OverlayPanel;
  
  inputDurationRange: string = '';
  operator: string = '>=';
  startMin: any = '';
  startSec: any = '';
  endMin: any = '';
  endSec: any = '';

  constructor(
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
  }

  onClear = () => {
    this.operator = ''
    this.startMin = ''
    this.startSec = ''
    this.endMin = ''
    this.endSec = ''
    this.inputDurationRange = ''
  }

  onClickApply = () => {
    if(
      this.startMin==null 
      || this.startSec==null 
      || this.endMin==null 
      || this.endSec==null 
    ) {
      this.onClear()
      this.op.hide();
      return
    }

    let start = String(Number(this.startMin)) + ':' + (Number(this.startSec)>9 ? String(Number(this.startSec)) : ('0' + String(Number(this.startSec))));
    let end = String(Number(this.endMin)) + ':' + (Number(this.endSec)>9 ? String(Number(this.endSec)) : ('0' + String(Number(this.endSec))));

    if(this.operator == 'between') {
      if(((this.endMin * 60) + this.endSec) <= ((this.startMin * 60) + this.startSec)) {
        this.showWarn('Start duration must be less then end duration.');
        return;
      }

      this.op.hide();
      this.inputDurationRange = start + '  ~  ' + end;
      this.setDurationRage.emit({
        operator: this.operator,
        duration: String((this.startMin * 60) + this.startSec) + ' and ' + String((this.endMin * 60) + this.endSec)
      })
    } else {
      this.op.hide();
      this.inputDurationRange = this.operator + ' ' + start;
      this.setDurationRage.emit({
        operator: this.operator,
        duration: String((this.startMin * 60) + this.startSec)
      })
    }
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string, summary: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: summary, detail: msg });
  };
  showInfo = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'info', summary: 'Info', detail: msg });
  };
}
