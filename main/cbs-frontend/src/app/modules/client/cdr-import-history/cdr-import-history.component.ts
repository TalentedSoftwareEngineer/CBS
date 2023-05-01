import { Component, OnInit } from '@angular/core';
import {MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-cdr-import-history',
  templateUrl: './cdr-import-history.component.html',
  styleUrls: ['./cdr-import-history.component.scss']
})
export class CdrImportHistoryComponent implements OnInit {

  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'updated_at';
  sortDirection = 'DESC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  imported_cdrs: any[] = [];

  serverOptions: any[] = [
    {name: 'All', value: ''}
  ];
  selectFilterServer: any = '';

  statusOptions: any[] = [
    {name: 'All', value: ''},
    {name: 'SUCCESS', value: 'SUCCESS'},
    {name: 'FAILED', value: 'FAILED'},
    {name: 'IMPORTING', value: 'IMPORTING'}
  ];
  selectFilterStatus: any = '';

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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.CDR_IMPORT_HISTORY)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    // this.store.state$.subscribe(async (state)=> {

    // })

    await this.getCdrServerForFilter();
    this.getImportedCDRsHistoryList();
    this.getTotalImportedCDRsHistoryCount();

    // this.api.getConfigurationsTest().subscribe(res=>{
    //   console.log(res);
    // });
  }

  getImportedCDRsHistoryList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue;
      await this.api.getImportedCDRsHistoryList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, this.selectFilterServer, this.selectFilterStatus)
        .pipe(tap(async (response: any[]) => {
          this.imported_cdrs = [];
          response.map(async u => {
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            // u.server_id = u.server_id ? await this.getServerName(this.serverOptions, u.server_id, name=>{u.server_id=name}) : '';
            u.server_id = u.server_id ? this.serverOptions.find(item=>item.value == u.server_id)?.name : '';
          });

          for (let item of response) {
            this.imported_cdrs.push(item)
          }
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getImportedCDRsHistoryCount(filterValue, this.selectFilterServer, this.selectFilterStatus)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalImportedCDRsHistoryCount = async () => {
    this.resultsLength = -1
    await this.api.getImportedCDRsHistoryCount('', '', '')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getCdrServerForFilter = async () => {
    await this.api.getCdrServerForFilter()
      .pipe(tap(async (response: any[]) => {
        this.serverOptions = [{name: 'All', value: ''}, ...response.map(item=>({name: item.name, value: item.id}))];
      })).toPromise();
  }

  getServerName = async (server: any[], server_id: number, callback: (name: string)=>void) => {
    let tmp_name = server.find(item=>item.value == server_id)?.name;
    callback(tmp_name);
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getImportedCDRsHistoryList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getImportedCDRsHistoryList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getImportedCDRsHistoryList();
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
