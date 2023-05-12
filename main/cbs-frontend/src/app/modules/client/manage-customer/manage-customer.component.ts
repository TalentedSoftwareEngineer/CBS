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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-manage-customer',
  templateUrl: './manage-customer.component.html',
  styleUrls: ['./manage-customer.component.scss']
})
export class ManageCustomerComponent implements OnInit {
  // customers variables
  pageSize = 100
  pageIndex = 1
  customers: any[] = []
  filterName = ''
  filterValue = ''
  sortActive = 'id'
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  write_permission: boolean = false;

  flag_openDialog: boolean = false;
  modalTitle: string = '';
  clickedId = -1;
  tabIndex: number = 0;
  allowed: boolean = false;

  companyForm: FormGroup = new FormGroup({
    company_name: new FormControl('', Validators.required),
    company_id: new FormControl('', Validators.required),
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]),
    status: new FormControl('ACTIVE', Validators.required),
  });
  credentialForm: FormGroup = new FormGroup({
    username: new FormControl({ value: '', disabled: !this.allowed }, Validators.required),
    new_password: new FormControl('', Validators.required),
    confirm_password: new FormControl('',Validators.required),
    allowed: new FormControl(false),
  });
  additionalForm: FormGroup = new FormGroup({
    address: new FormControl(),
    city: new FormControl(),
    state: new FormControl(),
    country: new FormControl(),
    zip: new FormControl(),
    phone: new FormControl(),
    ssn: new FormControl()
  });
  billingForm: FormGroup = new FormGroup({
    billing_email: new FormControl('', [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]),
    method: new FormControl('PREPAID'),
    cycle: new FormControl(-1),
    start: new FormControl(new Date())
  });

  ratesForm: FormGroup = new FormGroup({
    inidur: new FormControl({value: ''},  Validators.required),
    succdur: new FormControl({value: ''}, Validators.required),
    flat_rate: new FormControl(''),
    default_rate: new FormControl('', Validators.required),
    rate_type: new FormControl('FIXED')
  });

  inputCompanyName: string = '';
  inputCompanyId: string = '';
  inputBillingEmail: string = '';
  inputAddress: string = '';
  inputCity: string = '';
  inputState: string = '';
  inputCountry: string = '';
  inputZip: string = '';
  inputPhone: string = '';
  inputSSN: string = '';
  inputFirstName: string = '';
  inputLastName: string = '';
  inputEmail: string = '';

  inputUserName: string = '';
  input_confirm_password: string = '';
  input_new_password: string = '';

  billingMethodOptions: any[] = [
    {name: 'Prepaid', value: 'PREPAID'},
    {name: 'Postpaid', value: 'POSTPAID'}
  ];

  billingCycleOptions: any[] = [
    {name: 'None', value: -1},
    {name: 'Manual Bill/Statement', value: 0},
    {name: 'Weekly', value: 7},
    {name: 'Monthly', value: 30},
  ];

  statusOptions: any[] = [
    {name: 'Pending Auth.', value: 'PENDING'},
    {name: 'Active', value: 'ACTIVE'},
    {name: 'Temp On Hold', value: 'TEMP ON HOLD'},
  ];

  inputFlatRate: string = '';
  inputDefaultRate: string = '';
  inputInidur: string = '';
  inputSuccdur: string = '';
  selectRateType: string = 'FIXED';
  ratesTypeOptions: any[] = [
    {name: 'Flat Rate', value: 'FIXED'},
    {name: 'Inter/Intra Rate', value: 'INTER/INTRA'}
  ];

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location,
    private confirmationService: ConfirmationService,
    public router: Router,
    private fb: FormBuilder,
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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.READ_CUSTOMERS)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    this.store.state$.subscribe(async (state)=> {
      if(state.user.permissions?.indexOf(PERMISSIONS.WRITE_CUSTOMERS) == -1)
        this.write_permission = false;
      else
        this.write_permission = true;
    })

    this.getCustomersList();
    this.getTotalCustomersCount();
  }

  isCompanyFormFieldValid(field: string) {
    return !this.companyForm.get(field)?.valid && this.companyForm.get(field)?.touched;
  }

  isBillingFormFieldValid(field: string) {
    return !this.billingForm.get(field)?.valid && this.billingForm.get(field)?.touched;
  }

  isCredentialFormFieldValid(field: string) {
    return !this.credentialForm.get(field)?.valid && this.credentialForm.get(field)?.touched;
  }
  isRatesFormFieldValid(field: string) {
    return !this.ratesForm.get(field)?.valid && this.ratesForm.get(field)?.touched;
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

  getCustomersList = async () => {
    this.isLoading = true;
    try {

      let filterValue = this.filterValue;

      await this.api.getCustomersList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue)
        .pipe(tap(async (response: any[]) => {
          this.customers = [];
          response.map(u => {
            if(Boolean(this.store.getUser()?.timezone)) {
              // Timezone Time
              u.created_at = u.created_at ? moment(u.created_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(u.updated_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            } else {
              // Local time
              u.created_at = u.created_at ? moment(new Date(u.created_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            }
          });

          for (let item of response) {
            this.customers.push(item)
          }

        })).toPromise();

      this.filterResultLength = -1
      await this.api.getCustomersCount(filterValue, {})
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalCustomersCount = async () => {
    this.resultsLength = -1
    await this.api.getCustomersCount('', {})
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    this.flag_openDialog = true
    this.tabIndex = 0;
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  clearInputs = () => {
    this.companyForm.reset();
    this.credentialForm.reset();
    this.additionalForm.reset();
    this.billingForm.reset();
    this.ratesForm.reset();
  }

  onSubmit = async () => {
    if(this.companyForm.invalid || this.billingForm.invalid || this.ratesForm.invalid) {
      this.validateAllFormFields(this.companyForm)
      this.validateAllFormFields(this.billingForm)
      this.validateAllFormFields(this.ratesForm)
      if(this.companyForm.invalid) {
        this.tabIndex = 0;
      } else if(this.billingForm.invalid) {
        this.tabIndex = 1;
      } else if(this.ratesForm.invalid) {
        this.tabIndex = 2;
      }
    }

    let data: any = {
      company_id: this.companyForm.get('company_id')?.value,
      company_name: this.companyForm.get('company_name')?.value,
      first_name: this.companyForm.get('first_name')?.value,
      last_name: this.companyForm.get('last_name')?.value,
      email: this.companyForm.get('email')?.value,
      status: this.companyForm.get('status')?.value,
      billing_email: this.billingForm.get('billing_email')?.value,
      billing_method: this.billingForm.get('method')?.value,
      billing_cycle: this.billingForm.get('cycle')?.value,
      billing_start: moment(this.billingForm.get('start')?.value).format('YYYY/MM/DD'),
      default_rate: this.ratesForm.get('default_rate')?.value,
      rate_type: this.ratesForm.get('rate_type')?.value,
      init_duration: this.ratesForm.get('inidur')?.value,
      succ_duration: this.ratesForm.get('succdur')?.value,
    };

    if(this.selectRateType=='FIXED') {
      data.flat_rate = this.ratesForm.get('flat_rate')?.value;
    }

    await new Promise<void>(resolve => {
      this.api.createCustomer(data).subscribe(res => {

        this.confirmationService.confirm({
          message: 'Are you sure to create default company admin and user role?',
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            this.api.setCustomerRoles(res.id).subscribe(response=>{
              resolve()
            });
          },
          reject: (type: any) => {
              switch(type) {
                  case ConfirmEventType.REJECT:
                    resolve()
                    break;
                  case ConfirmEventType.CANCEL:
                    resolve()
                    break;
              }
          }
        });
      });
    })

    this.showSuccess('Successfully created!');
    this.closeModal();
    this.getCustomersList();
    this.getTotalCustomersCount();
  }

  onOpenEditModal = async (event: Event, id: number) => {
    this.clickedId = id;
    this.router.navigateByUrl(`${ROUTES.client_mng.customer_edit}?customer_id=${id}`);
  }

  delete = (event: Event, id: number) => {
    this.clickedId = id;
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteCustomerById(id).subscribe(res => {
          this.showSuccess('Successfully deleted!');
          this.getCustomersList();
          this.getTotalCustomersCount();
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

  onChangeAllowed = () => {
    if(!this.allowed) {
      this.credentialForm.controls['username'].disable();
      this.credentialForm.reset();
    } else {
      this.credentialForm.controls['username'].enable();
    }
  }

  onChangeRatesType = (event: any) => {

  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getCustomersList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getCustomersList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getCustomersList();
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
