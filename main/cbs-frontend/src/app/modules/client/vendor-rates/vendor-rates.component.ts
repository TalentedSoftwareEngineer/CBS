import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-vendor-rates',
  templateUrl: './vendor-rates.component.html',
  styleUrls: ['./vendor-rates.component.scss']
})
export class VendorRatesComponent implements OnInit {

  filterStatusOptions: any[] = [
    {name: 'All', value: ''},
    {name: 'Active', value: 'Active'},
    {name: 'Decommissioned', value: 'Decommissioned'},
    {name: 'Pending Auth.', value: 'Pending Auth.'},
    {name: 'Temp On Hold', value: 'Temp On Hold'},
  ];
  statusFilterValue: string = 'All';
  filterName = '';
  filterValue: string = '';

  // users variables
  pageSize = 100
  pageIndex = 1
  sortActive = 'id' //sortActive = {table field name}
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS
  isLoading = true;

  vendor_rates: any[] = [{id: 1, name: 'DIP_CPR_GEN1', phone: '781382 2222', email: 'alism@382com.com', status: 'Active', type: 'Vendor'}];
  selectedItem: any;

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location,
    private confirmationService: ConfirmationService,
    public router: Router
  ) { }

  async ngOnInit() {

  }

  onRowSelect = (event: Event) => {
  }

  onRowUnselect = (event: Event) => {
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    // await this.getUsersList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => {
    this.pageIndex = 1;
    // this.getUsersList();
  }

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    // await this.getUsersList();
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
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };
  showInfo = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'info', summary: 'Info', detail: msg });
  };

}
