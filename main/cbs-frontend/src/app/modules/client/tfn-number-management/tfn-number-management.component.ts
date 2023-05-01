import { Component, OnInit } from '@angular/core';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toBase64 } from 'src/app/helper/utils';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-tfn-number-management',
  templateUrl: './tfn-number-management.component.html',
  styleUrls: ['./tfn-number-management.component.scss']
})
export class TfnNumberManagementComponent implements OnInit {

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

  tfnNumbers: any[] = []

  customerOptions: any[] = [{name: 'All', value: ''}];
  selectCustomer: any = 0;

  filterCustomerOptions: any[] = [{name: 'All', value: ''}];
  customerFilterValue: string = '';

  write_permission: boolean = false;
  flag_openDialog: boolean = false;
  flag_openUploadDialog: boolean = false;
  modalTitle: string = '';
  clickedId: string = '';

  tfnNumberForm: FormGroup = new FormGroup({
    tfn_num: new FormControl('', [Validators.required, Validators.pattern(RegExp('^(800|833|844|855|866|877|888)(\\d{7}|\\-\\d{3}\\-\\d{4})$'))]),
    price: new FormControl('', [Validators.required]),
    customer_id: new FormControl('', [Validators.required]),
    trans_num: new FormControl(''),
    resp_org: new FormControl(''),
  });

  inputPrice: string = '';
  inputCustomer: string = '';
  inputTranslateNumber: string = '';
  inputRo: string = '';
  inputTollfreeNumber: string = '';

  uploadActionOptions: any[] = [
    {name: 'Append', value: 'APPEND'},
    {name: 'Update', value: 'UPDATE'},
    {name: 'Delete', value: 'DELETE'},
  ];
  uploadMethod = 'APPEND';
  isUpLoading: boolean = false;

  demoTfnNumbers: any[] = [
    {
      price: '0.0073',
      customer_id: 'DIP_CUS_ETI',
      trans_num: '8002055803',
      resp_org: 'XGO1',
      tfn_num: '8002055803'
    }
  ];

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.READ_TFN_NUMBERS)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    // this.store.state$.subscribe(async (state)=> {
      
    // })

    await this.getCustomerList();
    await this.getTfnNumbersList();
    await this.getTotalTfnNumberCount();
  }


  isTfnNumberFormFieldValid(field: string) {
    return !this.tfnNumberForm.get(field)?.valid && this.tfnNumberForm.get(field)?.touched;
  }

  validateAllFormFields(formGroup: FormGroup) {         //{1}
    Object.keys(formGroup.controls).forEach(field => {  //{2}
      const control = formGroup.get(field);             //{3}
      if (control instanceof FormControl) {             //{4}
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {        //{5}
        this.validateAllFormFields(control);            //{6}
      }
    });
  }
  
  getTfnNumbersList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue;

      await this.api.getTfnNumbersList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, this.customerFilterValue)
        .pipe(tap(async (response: any[]) => {
          this.tfnNumbers = [];
          response.map(u => {
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            u.customer_id = u.customer_id ? this.customerOptions.find(item=>item.value == u.customer_id)?.name : '';
          });

          this.tfnNumbers = response;
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getTfnNumberCount(filterValue, this.customerFilterValue)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalTfnNumberCount = async () => {
    this.resultsLength = -1
    await this.api.getTfnNumberCount('', '')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          this.customerOptions = [/*{name: 'All Customers', value: 0},*/ {name: 'Not Assigned', value: -1}, ...res.map(item=>({name: `${item.company_name} (${item.company_id})`, value: item.id}))];
          this.filterCustomerOptions = [{name: 'All', value: ''}, {name: 'Not Assigned', value: -1}, ...res.map(item=>({name: `${item.company_name} (${item.company_id})`, value: item.id}))];
        })).toPromise();
    } catch (e) {
    }
  }

  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    this.flag_openDialog = true
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  clearInputs = () => {
    this.tfnNumberForm.reset();
  }

  onSubmit = async () => {
    if (this.tfnNumberForm.invalid) {
      this.validateAllFormFields(this.tfnNumberForm)
      return
    }

    let price = this.tfnNumberForm.get('price')?.value;
    let customer_id = this.tfnNumberForm.get('customer_id')?.value;
    let trans_num = this.tfnNumberForm.get('trans_num')?.value;
    let resp_org = this.tfnNumberForm.get('resp_org')?.value;
    let tfn_num = this.tfnNumberForm.get('tfn_num')?.value.replace(/\D/g, '');

    let data = {
      price: price ? Number(price) : 0,
      customer_id: Number(customer_id),
      trans_num: trans_num ? trans_num : '',
      resp_org: resp_org ? resp_org : '',
      tfn_num: tfn_num ? tfn_num : ''
    }

    if(this.modalTitle.toLowerCase()=='add') {
      await this.api.createTfnNumber(data).pipe(tap(res=>{
        this.showSuccess('Successfully created!', 'Success');
        this.getTfnNumbersList();
        this.getTotalTfnNumberCount();
      })).toPromise();
    } else if(this.modalTitle.toLowerCase()=='edit') {
      await this.api.updateTfnNumber(this.clickedId, data).pipe(tap(res=>{
        this.getTfnNumbersList();
        this.showSuccess('Successfully updated!', 'Success');
      })).toPromise();
    }

    this.closeModal();
  }

  onOpenEditModal = (event: any, id: string) => {
    this.clickedId = id;
    this.api.getTfnNumber(id).subscribe(async res => {
      this.tfnNumberForm.setValue({
        price: res.price,
        customer_id: res.customer_id,
        trans_num: res.trans_num,
        resp_org: res.resp_org,
        tfn_num: res.tfn_num,
      });
      this.openModal('Edit');
    })
  }

  delete = (event: Event, id: string) => {
    this.clickedId = id;
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteTfnNumberById(id).subscribe(res => {
          this.showSuccess('Successfully deleted!', 'Success');
          this.getTfnNumbersList();
          this.getTotalTfnNumberCount();
        })
      },
      reject: (type: any) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                // this.showInfo('Rejected');
                break;
              case ConfirmEventType.CANCEL:
                // this.showInfo('Cancelled');
                break;
          }
      }
    });
  }

  onClickUpload = (event: Event) => {
    let input: any = (event.target as HTMLInputElement);
    input.value = null;
  }

  changeListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      this.isUpLoading = true;
      try {
        let file: File = event.target.files.item(0)
        const items = file.name.split('.')
        let file_extension = items[items.length - 1]
        let encoded_file: any = await toBase64(file)
        encoded_file = encoded_file.split(',')[1];
        if(encoded_file.length > 1024*1024*25) {
          this.showWarn('Please select the csv that file size are less than 25MB');
          return;
        }
        let body: any = {
          method: this.uploadMethod,
          encoded_file: encoded_file,
          extension: file_extension
        };
        this.api.uploadTfnNumber(body).subscribe(res=> {
          if(!res.failed) {
            this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
          } else if(!res.completed) {
            this.showError(`Failed: ${res.failed}  ${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\n${res.message}`);
          } else {
            this.showWarn(`Completed: ${res.completed} \n\nFailed: ${res.failed}  ${res.message!='' ? 'Upload completed for the following reasons!' : ''} \n\n${res.message}`);
          }
          
          this.flag_openUploadDialog = false;
          this.getTfnNumbersList();
          this.getTotalTfnNumberCount();
        });
      } catch (e) {
      } finally {
        setTimeout(() => this.isUpLoading = false, 1000);
      }
    }
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getTfnNumbersList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getTfnNumbersList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getTfnNumbersList();
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
