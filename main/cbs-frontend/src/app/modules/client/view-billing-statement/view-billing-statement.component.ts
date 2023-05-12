import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
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
import { defaultBanner } from '../default-ui-setting-values';
import { USER_TYPE } from 'src/app/consts/types';

@Component({
  selector: 'app-view-billing-statement',
  templateUrl: './view-billing-statement.component.html',
  styleUrls: ['./view-billing-statement.component.scss']
})
export class ViewBillingStatementComponent implements OnInit {

  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'start_at';
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  statements: any[] =  [];

  accountType: any = '';
  accountId: any;
  isUser: boolean = false;

  serverOptions: any[] = [];
  selectServer: string = '';

  customerOptions: any[] = [];
  selectCustomer: string = '';

  statusOptions: any[] = [
    {name: 'All', value: ''},
    {name: 'New', value: 'NEW'}
  ];
  selectStatus: string = '';

  selectedDate: any = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  ];
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

    this.store.state$.subscribe(async (state)=> {
      this.accountType = state.user.type;
      this.isUser = state.user.type == USER_TYPE.USER;
      this.accountId = state.user.id;
    })

    if(this.store.getUser().permissions?.includes(PERMISSIONS.VIEW_BILLING_STATEMENT)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    await this.getCdrServer();
    await this.getCustomerList();
    await this.getStatementsList();
    await this.getTotalStatementsCount();
  }

  getStatementsList = async () => {
    let offset = new Date().getTimezoneOffset()
    if(Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset*1000)/1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset*1000)/1000;

    this.isLoading = true;
    try {
      await this.api.getStatements(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, this.filterValue, this.isUser ? this.selectCustomer : this.accountId, this.selectServer, utcStart, utcEnd, this.selectStatus)
        .pipe(tap(async (response: any[]) => {
          this.statements = [];
          response.map(u => {
            u.customer_id = u.customer_id ? this.customerOptions.find(item=>(item.value == u.customer_id))?.name : '';
            u.server_id = u.server_id ? this.serverOptions.find(item=>(item.value == u.server_id))?.name : '';
            u.start_at = u.start_at ? moment.utc(Number(u.start_at) * 1000).utcOffset(-offset).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            u.end_at = u.end_at ? moment.utc(Number(u.end_at) * 1000).utcOffset(-offset).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';            
          });

          this.statements = response;
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getStatementCount(this.filterValue, this.isUser ? this.selectCustomer : this.accountId, this.selectServer, utcStart, utcEnd, this.selectStatus)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalStatementsCount = async () => {
    let offset = new Date().getTimezoneOffset()
    if(Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset*1000)/1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset*1000)/1000;

    this.resultsLength = -1
    await this.api.getStatementCount('', '', '', utcStart, utcEnd, '')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getCdrServer = async () => {
    this.serverOptions = [];
    await this.api.getCdrServerForFilter()
      .pipe(tap(async (response: any[]) => {
        this.serverOptions = [{name: 'All', value: ''}, ...response.map(item=>({name: item.name, value: item.id}))];
        this.selectServer = this.serverOptions[0].value;
      })).toPromise();
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          res.map(u => {
            u.full_companyTitle = u.company_name + ' (' + u.company_id + ')';
          });

          this.customerOptions = res.map(item=>({name: item.full_companyTitle, value: item.id}));
          this.selectCustomer = this.customerOptions[0].value;
        })).toPromise();
    } catch (e) {
    }

    this.isLoading = false
  }

  onSelectDateRangePicker = (event: any) => {
    if(this.selectedDate[0] != null && this.selectedDate[1] != null) {
      if(moment(this.selectedDate[0]).format('YYYY-MM-DD') == moment(this.selectedDate[1]).format('YYYY-MM-DD'))
        this.selectedDate = [this.selectedDate[0], null];

      this.calendar.hideOverlay()
    }
  }

  onClickToday = () => {
    this.selectedDate = [new Date(), null];
    this.calendar.hideOverlay()
  }

  onClickYesterday = () => {
    this.selectedDate = [moment().subtract(1, "days").toDate(), null];
    this.calendar.hideOverlay()
  }

  onClickLastWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay())));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()) + 6));
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickLastMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay();
  }

  onClickThisMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickThisWeek = () => {
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
    await this.getStatementsList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getStatementsList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getStatementsList();
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
