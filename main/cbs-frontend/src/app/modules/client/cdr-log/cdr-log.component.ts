import { Component, OnInit, ViewChild } from '@angular/core';
import {MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-cdr-log',
  templateUrl: './cdr-log.component.html',
  styleUrls: ['./cdr-log.component.scss']
})
export class CdrLogComponent implements OnInit {

  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'StartTime';
  sortDirection = 'DESC';
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  cdr_logs: any[] = [];

  durationRange: any = {
    operator: "",
    duration: ""
  };
  callCountRange: any = {
    operator: "",
    call_count: ""
  };

  serverOptions: any[] = [];
  selectServer: string = '';
  directionOptions: any[] = [
    {name: 'All', value: ''},
    {name: 'ORIGINATE', value: 'originate'},
    {name: 'ANSWER', value: 'answer'}
  ];
  selectDirection: string = '';

  napOptions: any[] = [];
  selectNap: string = '';

  selectedDate: any = [new Date(), null];
  // disabledDays: number[] = DISABLED_ALL_DAYS;

  @ViewChild('calendar') calendar!: Calendar;

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    public router: Router,
  ) { }

  async ngOnInit() {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser()) {
          clearInterval(mainUserInterval)
          resolve()
        }
      }, 100)
    })

    if(this.store.getUser().permissions?.includes(PERMISSIONS.CDR_LOG)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    // this.store.state$.subscribe(async (state)=> {

    // })

    await this.getCdrServer();
    await this.getNaps();
    await this.getCDRLogsList();
  }

  getCDRLogsList = async () => {
    // if(this.serverOptions.length < 2)
    // {
    //   this.showWarn('No CDR Servers');
    //   return;
    // }

    this.isLoading = true;
    try {
      let filterValue = this.filterValue;

      // let start_at = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00').getTime() / 1000;
      // let end_at = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59').getTime() / 1000;

      let offset = new Date().getTimezoneOffset()
      if(Boolean(this.store.getUser()?.timezone)) {
        offset = Number(this.store.getUser()?.timezone) * -60
      }

      let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
      let utcStart = (localStart.getTime() + offset*1000)/1000;

      let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
      let utcEnd = (localEnd.getTime() + offset*1000)/1000;

      await this.api.getCDRLogsList(
        this.sortActive,
        this.sortDirection,
        this.pageIndex,
        this.pageSize,
        filterValue,
        this.selectServer,
        utcStart,
        utcEnd,
        this.callCountRange?.operator,
        this.callCountRange?.call_count,
        this.durationRange?.operator,
        this.durationRange?.duration,
        this.selectNap
        /*this.selectDirection*/
      ).pipe(tap(async (response: any[]) => {
        this.cdr_logs = [];
        response.map(u => {
          // u.StartTime = u.StartTime ? moment.utc(Number(u.StartTime) * 1000).format('MM/DD/YYYY h:mm:ss A') : '';
          // u.EndTime = u.EndTime ?  moment.utc(Number(u.EndTime) * 1000).format('MM/DD/YYYY h:mm:ss A') : '';
          u.StartTime = u.StartTime ? moment.utc(Number(u.StartTime) * 1000).utcOffset(-offset).format('MM/DD/YYYY h:mm:ss A') : '';
          u.EndTime = u.EndTime ?  moment.utc(Number(u.EndTime) * 1000).utcOffset(-offset).format('MM/DD/YYYY h:mm:ss A') : '';
          u.Duration = u.Duration ? (Math.floor(u.Duration / 60) + ':' + ((u.Duration % 60) > 9 ? (u.Duration % 60) : '0'+(u.Duration % 60))) : '';
        });

        for (let item of response) {
          this.cdr_logs.push(item)
        }
      })).toPromise();

      // this.filterResultLength = -1;
      await this.api.getCDRLogsCount(
        filterValue,
        this.selectServer,
        utcStart,
        utcEnd,
        this.callCountRange?.operator,
        this.callCountRange?.call_count,
        this.durationRange?.operator,
        this.durationRange?.duration,
        this.selectNap
      ).pipe(tap( res => {
        this.filterResultLength = res.total_count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getCdrServer = async () => {
    this.serverOptions = [];
    await this.api.getCdrServerForFilter()
      .pipe(tap(async (response: any[]) => {
        // response.forEach(res_item=>{
        //   let server = this.serverOptions.find(item=>item.name==res_item.table_name);
        //   if(!server)
        //     this.serverOptions.push({name: res_item.table_name, value: res_item.table_name});
        // });
        this.serverOptions = [{name: 'All', value: ''}, ...response.map(item=>({name: item.name, value: item.id}))];
        this.selectServer = this.serverOptions[0].value;
      })).toPromise();
  }

  getNaps = async () => {
    this.api.getNapsForFilter(this.selectServer).subscribe((res: any[])=>{
      this.napOptions = [{name: 'All', value: ''}, ...res.map(item=>({name: item.name, value: item.name}))];
    });
  }

  cdrLogExport = async () => {
    let offset = new Date().getTimezoneOffset()
    if(Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset*1000)/1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset*1000)/1000;

      await this.api.exportCDRLogsList(
        this.sortActive,
        this.sortDirection,
        this.filterValue,
        this.selectServer,
        utcStart,
        utcEnd,
        this.callCountRange?.operator,
        this.callCountRange?.call_count,
        this.durationRange?.operator,
        this.durationRange?.duration,
        this.selectNap
      ).pipe(tap(async (response: any[]) => {
        response.map(u => {
          u.StartTime = u.StartTime ? moment.utc(Number(u.StartTime) * 1000).utcOffset(-offset).format('MM/DD/YYYY h:mm:ss A') : '';
          u.EndTime = u.EndTime ?  moment.utc(Number(u.EndTime) * 1000).utcOffset(-offset).format('MM/DD/YYYY h:mm:ss A') : '';
          u.Duration = u.Duration ? (Math.floor(u.Duration / 60) + ':' + ((u.Duration % 60) > 9 ? (u.Duration % 60) : '0'+(u.Duration % 60))) : '';
        });

        let cdrLogsContent = '';
        response.forEach((item, index) => {
          cdrLogsContent += `\n${item.StartTime}, ${item.EndTime}, ${item.Calling==null?'':item.Calling}, ${item.Called==null?'':item.Called}, ${item.calls==null?'':item.calls}, ${item.Duration==null?'':item.Duration}, ${item.NAP_Originate==null?'':item.NAP_Originate}, ${item.NAP_Answer==null?'':item.NAP_Answer}`;
        });

        let data = `Start Time,End Time,Calling,Called,Calls,Duration,NAP Originate,NAP Answer${cdrLogsContent}`

        const csvContent = 'data:text/csv;charset=utf-8,' + data;
        const url = encodeURI(csvContent);
        let fileName = 'CDR_Logs'+moment(new Date()).format('YYYY_MM_DD_hh_mm_ss');

        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.setAttribute('download', fileName);
        tempLink.click();
      })).toPromise();
  }

  setFilterDurationRage = (event: any) => {
    this.durationRange = event;
  }

  setFilterCallCountRage = (event: any) => {
    this.callCountRange = event;
  }

  onSelectDateRangePicker = (event: any) => {
    if(this.selectedDate[0] != null && this.selectedDate[1] != null) {
      if(moment(this.selectedDate[0]).format('YYYY-MM-DD') == moment(this.selectedDate[1]).format('YYYY-MM-DD'))
        this.selectedDate = [this.selectedDate[0], null];

      this.calendar.hideOverlay()
    }
  }

  onClickToday = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;
    this.selectedDate = [new Date(), null];
    this.calendar.hideOverlay()
  }

  onClickYesterday = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;
    this.selectedDate = [moment().subtract(1, "days").toDate(), null];
    this.calendar.hideOverlay()
  }

  onClickLastWeek = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay())));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()) + 6));
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickLastMonth = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickThisMonth = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickThisWeek = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay())));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()) + 6));
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getCDRLogsList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getCDRLogsList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getCDRLogsList();
  }

  paginate = (event: any) => {
    this.onPagination(event.page+1, event.rows);
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
