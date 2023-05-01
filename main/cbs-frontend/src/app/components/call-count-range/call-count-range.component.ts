import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'c-call-count-range',
  templateUrl: './call-count-range.component.html',
  styleUrls: ['./call-count-range.component.scss']
})
export class CallCountRangeComponent implements OnInit {

  @Output() setCallCountRage = new EventEmitter<any>();
  
  @ViewChild('op') op!: OverlayPanel;
  
  inputCallCountRange: string = '';
  operator: string = '>=';

  startCallCount: any = '';
  endCallCount: any = '';

  constructor(
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
  }

  onClear = () => {
    this.operator = ''
    this.startCallCount = ''
    this.endCallCount = ''
    this.inputCallCountRange = ''
  }

  onClickApply = () => {
    if(
      this.startCallCount==null 
      || this.startCallCount==undefined 
      || this.endCallCount==null 
      || this.endCallCount==undefined
    ) {
      this.onClear()
    }
    
    if(this.operator == 'between') {
      if(Number(this.startCallCount) >= Number(this.endCallCount)) {
        this.showWarn('Start call count must be less then end call count.');
        return;
      }

      this.op.hide();
      this.inputCallCountRange = this.startCallCount.toString() + '  ~  ' + this.endCallCount.toString();
      this.setCallCountRage.emit({
        operator: this.operator,
        call_count: String(this.startCallCount) + ' and ' + String(this.endCallCount)
      })
    } else {
      this.op.hide();
      this.inputCallCountRange = this.operator + '  ' + String(this.startCallCount);
      this.setCallCountRage.emit({
        operator: this.operator,
        call_count: String(this.startCallCount)
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
