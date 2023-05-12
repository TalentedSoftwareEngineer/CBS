import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { toBase64 } from 'src/app/helper/utils';
import {PAGE_SIZE_OPTIONS, SUPER_ADMIN_ROLE_ID} from '../../constants';
import {USER_TYPE} from "../../../consts/types";

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss']
})
export class CustomerEditComponent implements OnInit {
  isSuperAdmin: boolean = false;

  //resource group table
  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'id' //sortActive = {table field name}
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS
  isLoading = true

  //rate table
  ratePageSize = 15
  ratePageIndex = 1
  rateFilterName = ''
  rateFilterValue = ''
  rateSortActive = 'id' //sortActive = {table field name}
  rateSortDirection = 'ASC'
  rateResultsLength = -1
  rateFilterResultLength = -1;
  rateRowsPerPageOptions: any[] = [10, 25, 50]
  rateIsLoading = false;

  //Npanxx Lerg Rate Table
  npanxxPageSize = 100
  npanxxPageIndex = 1
  npanxxFilterName = ''
  npanxxFilterValue = ''
  npanxxSortActive = 'id';
  npanxxSortDirection = 'ASC'
  npanxxResultsLength = -1
  npanxxFilterResultLength = -1;
  npanxxIsLoading = true
  npanxxRowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;
  npanxxRates: any[] = []

  //TFN Numbers Table
  tfnNumbersPageSize = 100
  tfnNumbersPageIndex = 1
  tfnNumbersFilterName = ''
  tfnNumbersFilterValue = ''
  tfnNumbersSortActive = 'updated_at';
  tfnNumbersSortDirection = 'DESC'
  tfnNumbersResultsLength = -1
  tfnNumbersFilterResultLength = -1;
  tfnNumbersIsLoading = true
  tfnNumbersRowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;
  tfnNumbers: any[] = []

  filterCustomerOptions: any[] = [{name: 'All', value: ''}];

  tableFlatRate: string = ''

  groups: any[] = [];

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
  resourceGroupForm: FormGroup = new FormGroup({
    rgid: new FormControl('', Validators.required),
    description: new FormControl(''),
    partition_id: new FormControl(''),
    ip: new FormControl(),
    active: new FormControl(false, Validators.required),
    direction: new FormControl('INBOUND', Validators.required),
  });
  primaryRateForm: FormGroup = new FormGroup({
    inidur: new FormControl({value: ''}, Validators.required),
    succdur: new FormControl({value: ''}, Validators.required),
    flat_rate: new FormControl(''),
    default_rate: new FormControl('', Validators.required),
    rate_type: new FormControl('FIXED')
  });
  rateForm: FormGroup = new FormGroup({
    prefix: new FormControl('', Validators.required),
    destination_name: new FormControl('', Validators.required),
    intra_rate: new FormControl('', Validators.required),
    inter_rate: new FormControl('', Validators.required),
    init_dur: new FormControl('', Validators.required),
    succ_dur: new FormControl('', Validators.required),
  });
  productSettingsForm: FormGroup = new FormGroup({
    accounting_type: new FormControl(0),
    // postpaid_billing: new FormControl(false),
    local_did_fee: new FormControl(2.00),
    local_did_setup_fee: new FormControl(0.00),
    toll_free_fee: new FormControl(3.00),
    toll_free_setup_fee: new FormControl(0.00),
    // inbound_cost_per_minute: new FormControl(0.0),
    // outbound_cost_per_minute: new FormControl(0.0),
    // rate_type: new FormControl('60/60'),
  });

  directionOptions: any[] = [
    {name: 'INBOUND', value: 'INBOUND'},
    {name: 'OUTBOUND', value: 'OUTBOUND'}
  ];
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

  modalTitle: string = '';
  flag_openDialog: boolean = false;
  flag_openUploadDialog: boolean = false;
  flag_openRateUploadDialog: boolean = false;
  filterStatusOptions: any[] = [
    {name: 'All', value: ''},
    {name: '✔︎ Active', value: 'Y'},
    {name: '✖︎ Inactive', value: 'N'}
  ];
  statusFilterValue: any = '';
  filterDirectionOptions: any[] = [
    {name: 'All', value: ''},
    {name: 'INBOUND', value: 'INBOUND'},
    {name: 'OUTBOUND', value: 'OUTBOUND'},
  ];
  directionFilterValue: string = '';

  uploadActionOptions: any[] = [
    {name: 'Append', value: 'APPEND'},
    {name: 'Update', value: 'UPDATE'},
    {name: 'Delete', value: 'DELETE'},
  ];
  uploadMethod = 'APPEND';
  rateUploadMethod = 'APPEND';
  uploadGroups: any[] = [
    {
      rgid: 22,
      partition_id: 7037,
      description: 'DIP_382_ATT',
      direction: 'I',
      ip: '208.73.232.22',
      status: 'ACTIVE'
    },
    {
      rgid: 27,
      partition_id: 7045,
      description: 'DIP_539_ATT',
      direction: 'INBOUND',
      ip: '208.73.232.23',
      status: 'ACTIVE'
    }
  ];

  demoRates: any[] = [
    {
      prefix: '1201291',
      destination_name: 'USA',
      intra_rate: '0.01710',
      inter_rate: '0.01710	',
      init_dur: '6',
      succ_dur: '6',
    }
  ];

  rates: any[] = [];
  rateModalTitle: string = '';
  flag_openRateDialog: boolean = false;

  inputFlatRate: string = '';
  inputDefaultRate: string = '';
  inputInidur: string = '';
  inputSuccdur: string = '';
  selectRateType: string = 'FIXED';
  ratesTypeOptions: any[] = [
    {name: 'Flat Rate', value: 'FIXED'},
    {name: 'Inter/Intra Rate', value: 'INTER/INTRA'}
  ];
  isGenerating: boolean = false;

  customer_id: number = -1;
  clickedId = '';

  isUpLoading: boolean = false;
  isRateUpLoading: boolean = false;

  //Product Settings
  accountingType = [
    { name: 'Enabled', value: 1 },
    { name: 'Disabled', value: 0 },
  ]
  selectedAccountingType = 0
  isPostpaid = false;

  localdid: number = 2.00;
  localdid_fee: number = 0.00;
  tollfree: number = 3.00;
  tollfree_fee: number = 0.00;
  inbound_cost_per_minute: number = 0.0;
  outbound_cost_per_minute: number = 0.0;

  rateTypes = [
    { name: '60/60', value: '60/60' },
    { name: '6/6', value: '6/6' },
  ]
  selectedRateType = '60/60'

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location,
    private confirmationService: ConfirmationService,
    public router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.WRITE_CUSTOMERS)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    this.store.state$.subscribe(async (state)=> {
      this.isSuperAdmin = state.user?.type==USER_TYPE.USER && state.user?.role_id == SUPER_ADMIN_ROLE_ID;
    })

    await new Promise<void>(resolve=> {
      this.activatedRoute.queryParams.subscribe((params) => {
        this.customer_id = params['customer_id'];
        resolve();
      });
    });

    this.initCustomer();
    this.getGroupsList();
    this.getTotalUsersCount();

    this.getRatesList();
    this.getTotalRatesCount();

    // await this.getCustomerList();
    await this.getTfnNumbersList();
    await this.getTotalTfnNumberCount();
  }

  createData = (name: string, value: number) => {
    return {
      name,
      value
    };
  }

  getGroupsList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue

      await this.api.getGroupsList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, this.directionFilterValue, this.statusFilterValue, this.customer_id)
        .pipe(tap(async (groupsRes: any[]) => {
          this.groups = [];
          groupsRes.map(u => {
            if(Boolean(this.store.getUser()?.timezone)) {
              // Timezone Time
              u.created_at = u.created_at ? moment(u.created_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(u.updated_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            } else {
              // Local time
              u.created_at = u.created_at ? moment(new Date(u.created_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            }
            // u.created_by = u.created_by ? this.getAuditionedUsername(u.created_by, username=>{u.created_by=username}) : '';
            // u.updated_by = u.updated_by ? this.getAuditionedUsername(u.updated_by, username=>u.updated_by=username) : '';
          });

          for (let group of groupsRes) {
            this.groups.push(group)
          }

        })).toPromise();

      this.filterResultLength = -1
      await this.api.getGroupsCount(filterValue, this.directionFilterValue, this.statusFilterValue, this.customer_id).pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalUsersCount = async () => {
    this.resultsLength = -1
    await this.api.getGroupsCount('', '', '', this.customer_id).pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getRatesList = async () => {
    this.rateIsLoading = true;
    try {
      let rateFilterValue = this.rateFilterValue

      await this.api.getRatesList(this.rateSortActive, this.rateSortDirection, this.ratePageIndex, this.ratePageSize, rateFilterValue, this.customer_id)
        .pipe(tap(async (ratesRes: any[]) => {
          this.rates = [];
          ratesRes.map(u => {
            if(Boolean(this.store.getUser()?.timezone)) {
              // Timezone Time
              u.created_at = u.created_at ? moment(u.created_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(u.updated_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            } else {
              // Local time
              u.created_at = u.created_at ? moment(new Date(u.created_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '';
            }
            // u.created_by = u.created_by ? this.getAuditionedUsername(u.created_by, username=>{u.created_by=username}) : '';
            // u.updated_by = u.updated_by ? this.getAuditionedUsername(u.updated_by, username=>u.updated_by=username) : '';
          });

          for (let rate of ratesRes) {
            this.rates.push(rate)
          }

        })).toPromise();

      this.rateFilterResultLength = -1
      await this.api.getRatesCount(rateFilterValue, this.customer_id).pipe(tap( res => {
        this.rateFilterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.rateIsLoading = false, 1000);
    }
  }

  getTotalRatesCount = async () => {
    this.rateResultsLength = -1
    await this.api.getRatesCount('', this.customer_id).pipe(tap( res => {
      this.rateResultsLength = res.count
    })).toPromise();
  }

  getLergsRatesList = async () => {
    this.npanxxIsLoading = true;
    try {
      let filterValue = this.npanxxFilterValue;

      await this.api.getLergsRatesList(this.npanxxSortActive, this.npanxxSortDirection, this.npanxxPageIndex, this.npanxxPageSize, filterValue)
        .pipe(tap(async (response: any[]) => {
          this.npanxxRates = [];
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
            item.npa = item.npanxx.slice(0, 3);
            item.nxx = item.npanxx.slice(3, 6);
            item.flat_rate = this.tableFlatRate;
            this.npanxxRates.push(item)
          }
        })).toPromise();

      this.npanxxFilterResultLength = -1;
      await this.api.getLergsRatesCount(filterValue)
      .pipe(tap( res => {
        this.npanxxFilterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.npanxxIsLoading = false, 1000);
    }
  }

  getTotalLergsRatesCount = async () => {
    this.npanxxResultsLength = -1
    await this.api.getLergsRatesCount('')
    .pipe(tap( res => {
      this.npanxxResultsLength = res.count
    })).toPromise();
  }

  getTfnNumbersList = async () => {
    this.tfnNumbersIsLoading = true;
    try {
      let filterValue = this.tfnNumbersFilterValue;

      await this.api.getCustomerTfnNumbersList(this.tfnNumbersSortActive, this.tfnNumbersSortDirection, this.tfnNumbersPageIndex, this.tfnNumbersPageSize, filterValue, this.customer_id)
        .pipe(tap(async (response: any[]) => {
          this.tfnNumbers = [];
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
            // u.customer_id = u.customer_id ? this.filterCustomerOptions.find(item=>item.value == u.customer_id)?.name : '';
          });

          this.tfnNumbers = response;
        })).toPromise();

      this.tfnNumbersFilterResultLength = -1;
      await this.api.getCustomerTfnNumberCount(filterValue, this.customer_id)
      .pipe(tap( res => {
        this.tfnNumbersFilterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.tfnNumbersIsLoading = false, 1000);
    }
  }

  getTotalTfnNumberCount = async () => {
    this.tfnNumbersResultsLength = -1
    await this.api.getCustomerTfnNumberCount('', this.customer_id)
    .pipe(tap( res => {
      this.tfnNumbersResultsLength = res.count
    })).toPromise();
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          let customerOptions = [{name: 'All Customers', value: 0}, ...res.map(item=>({name: `${item.company_name} (${item.company_id})`, value: item.id}))];
          this.filterCustomerOptions = [{name: 'All', value: ''}, ...customerOptions];
        })).toPromise();
    } catch (e) {
    }
  }

  initCustomer = () => {
    this.api.getCustomer(this.customer_id).subscribe(async res => {
      this.companyForm.setValue({
        company_name: res.company_name,
        company_id: res.company_id,
        first_name: res.first_name,
        last_name: res.last_name,
        email: res.email,
        status: res.status
      });
      this.credentialForm.setValue({
        username: res.credentials?.username ? res.credentials?.username : '',
        new_password: '',
        confirm_password: '',
        allowed: res.allowed
      });
      if(res.allowed) {
        this.credentialForm.controls['username'].enable();
      } else {
        this.credentialForm.controls['username'].disable();
      }
      this.allowed = res.allowed;
      this.additionalForm.setValue({
        address: res.customerInfo?.address ? res.customerInfo?.address : '',
        city: res.customerInfo?.city ? res.customerInfo?.city : '',
        state: res.customerInfo?.state ? res.customerInfo?.state : '',
        country: res.customerInfo?.country ? res.customerInfo?.country : '',
        zip: res.customerInfo?.zip ? res.customerInfo?.zip : '',
        phone: res.customerInfo?.phone ? res.customerInfo?.phone : '',
        ssn: res.customerInfo?.ssn ? res.customerInfo?.ssn : '',
      });
      this.billingForm.setValue({
        billing_email: res.customerBilling?.email ? res.customerBilling?.email : '',
        method: res.customerBilling?.method ? res.customerBilling?.method : 'ACTIVE',
        cycle: res.customerBilling?.cycle ? res.customerBilling?.cycle : -1,
        start: res.customerBilling?.start != undefined ? new Date(res.customerBilling?.start) : new Date()
      });

      this.productSettingsForm.setValue({
        accounting_type: res.customerProduct?.account_type ? res.customerProduct?.account_type : 0,
        local_did_fee: res.customerProduct?.local_did_fee ? res.customerProduct?.local_did_fee : 2.00,
        local_did_setup_fee: res.customerProduct?.local_did_setup_fee ? res.customerProduct?.local_did_setup_fee : 0.00,
        toll_free_fee: res.customerProduct?.tollfree_fee ? res.customerProduct?.tollfree_fee : 3.00,
        toll_free_setup_fee: res.customerProduct?.tollfree_setup_fee ? res.customerProduct?.tollfree_setup_fee : 0.00
      });

      this.selectRateType = res.rate_type;
      this.inputFlatRate = res.flat_rate;
      this.tableFlatRate = res.flat_rate;
      this.inputDefaultRate = res.default_rate;
      this.inputInidur = res.init_duration;
      this.inputSuccdur = res.succ_duration;

      this.setCustomerRateFormDefault();
    })
  }

  setCustomerRateFormDefault = () => {
    this.api.getRateDefault(this.customer_id).subscribe(res=> {
      this.rateForm.setValue({
        prefix: '',
        destination_name: '',
        intra_rate: res.default_rate ? res.default_rate : '',
        inter_rate: res.default_rate ? res.default_rate : '',
        init_dur: res.init_duration ? res.init_duration : '',
        succ_dur: res.succ_duration ? res.succ_duration : '',
      });

      this.inputFlatRate = res.flat_rate;
      this.tableFlatRate = res.flat_rate;
      this.inputDefaultRate = res.default_rate;
    });
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

  isResourceGroupFormFieldValid(field: string) {
    return !this.resourceGroupForm.get(field)?.valid && this.resourceGroupForm.get(field)?.touched;
  }

  isRateFieldValid(field: string) {
    return !this.rateForm.get(field)?.valid && this.rateForm.get(field)?.touched;
  }

  isPrimaryRateFormFieldValid(field: string) {
    return !this.primaryRateForm.get(field)?.valid && this.primaryRateForm.get(field)?.touched;
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

  onUpdatedCompanySubmit = async () => {
    if (this.companyForm.invalid) {
      this.validateAllFormFields(this.companyForm)
      return
    }

    let data = {
      company_id: this.companyForm.get('company_id')?.value,
      company_name: this.companyForm.get('company_name')?.value,
      first_name: this.companyForm.get('first_name')?.value,
      last_name: this.companyForm.get('last_name')?.value,
      email: this.companyForm.get('email')?.value,
      status: this.companyForm.get('status')?.value,
    }

    await this.api.updateCompany(this.customer_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onUpdatedCredentialSubmit = async () => {
    if (this.credentialForm.invalid && this.credentialForm.get('allowed')?.value) {
      this.validateAllFormFields(this.credentialForm)
      return
    }

    if(this.credentialForm.get('new_password')?.value != this.credentialForm.get('confirm_password')?.value) {
      this.showWarn('Please confirm password');
      return
    }

    let data = {
      username: this.credentialForm.get('username')?.value,
      new_password: this.credentialForm.get('new_password')?.value,
      confirm_password: this.credentialForm.get('confirm_password')?.value,
      allowed: this.credentialForm.get('allowed')?.value==undefined ? false : this.credentialForm.get('allowed')?.value
    }

    await this.api.updateCredential(this.customer_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onUpdatedAdditionalSubmit = async () => {
    let data = {
      address: this.additionalForm.get('address')?.value,
      city: this.additionalForm.get('city')?.value,
      state: this.additionalForm.get('state')?.value,
      country: this.additionalForm.get('country')?.value,
      zip: this.additionalForm.get('zip')?.value,
      phone: this.additionalForm.get('phone')?.value,
      ssn: this.additionalForm.get('ssn')?.value
    }

    await this.api.updateAdditional(this.customer_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onUpdatedPrimarySubmit = async () => {
    if (this.primaryRateForm.invalid) {
      this.validateAllFormFields(this.primaryRateForm)
      return
    }

    let customer_info = await new Promise<any>(resolve=> {
      this.api.getCustomer(this.customer_id).subscribe(async res => {
        resolve(res);
      })
    });

    let data: any = {
      default_rate: Number(this.inputDefaultRate),
      rate_type: this.selectRateType,
      init_duration: Number(this.inputInidur),
      succ_duration: Number(this.inputSuccdur),
    }

    if(this.selectRateType=='FIXED') {
      data.flat_rate = Number(this.inputFlatRate);
    }

    await this.api.updateRates(this.customer_id, data).pipe(tap(res=>{
      this.tableFlatRate = this.inputFlatRate;
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onUpdatedBillingSubmit = async () => {
    if (this.billingForm.invalid) {
      this.validateAllFormFields(this.billingForm)
      return
    }

    let data = {
      email: this.billingForm.get('billing_email')?.value,
      method: this.billingForm.get('method')?.value,
      cycle: this.billingForm.get('cycle')?.value,
      start: moment(this.billingForm.get('start')?.value).format('YYYY/MM/DD'),
    }
    await this.api.updateBilling(this.customer_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onChangeAllowed = () => {
    if(!this.allowed) {
      this.credentialForm.controls['username'].disable();
      this.credentialForm.reset();
    } else {
      this.credentialForm.controls['username'].enable();
    }
  }

  onBlurNewPassword = () => {

  }

  onBlurConfirmPassword = () => {

  }

  onGenerate = async () => {
    await this.onUpdatedPrimarySubmit();
    this.isGenerating = !this.isGenerating;
    if(this.isGenerating) {
      this.getLergsRatesList();
      this.getTotalLergsRatesCount();
    }
  }

  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    if(modal_title == 'Add') {
      this.resourceGroupForm.controls['rgid'].enable();
    } else {
      this.resourceGroupForm.controls['rgid'].disable();
    }

    this.flag_openDialog = true
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  onOpenEditModal = async (event: any, id: string) => {
    this.clickedId = id;
    await this.setResourceGroupFormData(id);
    this.openModal('Edit');
  }

  deleteGroup = (event: any, id: string) => {
    this.clickedId = id;
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete this?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.api.deleteResourceGroup(id).subscribe(res => {
            this.showSuccess('Successfully deleted!', 'Success')
            this.getGroupsList();
            this.getTotalUsersCount();
          })
        },
        reject: (type: any) => {
            switch(type) {
                case ConfirmEventType.REJECT:
                  break;
                case ConfirmEventType.CANCEL:
                  break;
            }
        }
    });
  }

  clearInputs = () => {
    this.resourceGroupForm.reset();
  }

  onResourceGroupSubmit = (modalTitle: string) => {
    if (this.resourceGroupForm.invalid) {
      this.validateAllFormFields(this.resourceGroupForm)
      return
    }
    let data = {
      rgid: this.resourceGroupForm.get('rgid')?.value,
      partition_id: Number(this.resourceGroupForm.get('partition_id')?.value),
      ip: this.resourceGroupForm.get('ip')?.value,
      direction: this.resourceGroupForm.get('direction')?.value,
      active: this.resourceGroupForm.get('active')?.value,
      description: this.resourceGroupForm.get('description')?.value,
    }
    if(modalTitle == 'Add') {
      this.api.createResourceGroup(this.customer_id, data).subscribe(res=> {
        this.showSuccess('Successfully created!', 'Success');
        this.closeModal();
        this.getGroupsList();
        this.getTotalUsersCount();
      });
    } else {
      this.api.updateResourceGroup(this.clickedId, data).subscribe(res=> {
        this.showSuccess('Successfully updated!', 'Success');
        this.closeModal();
        this.getGroupsList();
        this.getTotalUsersCount();
      });
    }
  }

  setResourceGroupFormData = (id: string) => {
    return new Promise<void>(resolve=>{
      this.api.getResourceGroup(id).subscribe(res=> {
        this.resourceGroupForm.setValue({
          rgid: res.rgid ? res.rgid : '',
          description: res.description ? res.description : '',
          partition_id: (res.partition_id || res.partition_id==0) ? res.partition_id : '',
          ip: res.ip ? res.ip : '',
          active: res.active ? res.active : false,
          direction: res.direction ? res.direction : 'INBOUND',
        });
        resolve();
      });
    });
  }

  setRateFormData = (id: string) => {
    return new Promise<void>(resolve=>{
      this.api.getRate(id).subscribe(res=> {
        this.rateForm.setValue({
          prefix: res.prefix,
          destination_name: res.destination,
          intra_rate: res.intra_rate,
          inter_rate: res.inter_rate,
          init_dur: res.init_duration,
          succ_dur: res.succ_duration,
        });
        resolve();
      });
    });
  }

  openUploadModal = () => {
    this.flag_openUploadDialog = true;
  }

  closeUploadModal = () => {
    this.flag_openUploadDialog = false;
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
        this.api.uploadResourceGroup(this.customer_id, body).subscribe(res=> {
          if(!res.failed) {
            this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
          } else if(!res.completed) {
            this.showError(`Failed: ${res.failed}  ${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\n${res.message}`);
          } else {
            this.showWarn(`Completed: ${res.completed} \n\nFailed: ${res.failed}  ${res.message!='' ? 'Upload completed for the following reasons!' : ''} \n\n${res.message}`);
          }
          this.getGroupsList();
          this.getTotalUsersCount();
          this.closeUploadModal();
        });
      } catch (e) {
      } finally {
        setTimeout(() => this.isUpLoading = false, 1000);
      }
    }
  }

  changeRateListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      this.isRateUpLoading = true;
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
          method: this.rateUploadMethod,
          encoded_file: encoded_file,
          extension: file_extension
        };
        this.api.uploadRate(this.customer_id, body).subscribe(res=> {
          if(!res.failed) {
            this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
          } else if(!res.completed) {
            this.showError(`Failed: ${res.failed}  ${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\n${res.message}`);
          } else {
            this.showWarn(`Completed: ${res.completed} \n\nFailed: ${res.failed}  ${res.message!='' ? 'Upload completed for the following reasons!' : ''} \n\n${res.message}`);
          }

          this.getRatesList();
          this.getTotalRatesCount();
          this.flag_openRateUploadDialog = false;
        });
      } catch (e) {
      } finally {
        setTimeout(() => this.isRateUpLoading = false, 1000);
      }
    }
  }

  openRateModal = (rateModalTitle: string) => {
    if(rateModalTitle.toLowerCase()=='add') {
      this.setCustomerRateFormDefault();
    }

    this.flag_openRateDialog = true;
    this.rateModalTitle = rateModalTitle;
  }

  closeRateModal = () => {
   this.flag_openRateDialog = false;
   this.rateForm.reset();
  }

  onRateSubmit = (rateModalTitle: string) => {
    if (this.rateForm.invalid) {
      this.validateAllFormFields(this.rateForm)
      return
    }

    let data = {
      // customer_id: this.customer_id,
      prefix: this.rateForm.get('prefix')?.value,
      destination: this.rateForm.get('destination_name')?.value,
      intra_rate: Number(this.rateForm.get('intra_rate')?.value),
      inter_rate: Number(this.rateForm.get('inter_rate')?.value),
      init_duration: Number(this.rateForm.get('init_dur')?.value),
      succ_duration: Number(this.rateForm.get('succ_dur')?.value),
    }

    if(rateModalTitle == 'Add') {
      this.api.createRate(this.customer_id, data).subscribe(res=> {
        this.showSuccess('Successfully created!', 'Success');
        this.closeRateModal();
        this.getRatesList();
        this.getTotalRatesCount();
      });
    } else if(rateModalTitle=='Edit') {
      this.api.updateRate(this.clickedId, data).subscribe(res=> {
        this.showSuccess('Successfully updated!', 'Success');
        this.closeRateModal();
        this.getRatesList();
        this.getTotalRatesCount();
      });
    } else {
      this.showWarn('Please Input again.');
    }
  }

  onOpenRateEditModal = async (event: any, id: string) => {
    this.clickedId = id;
    await this.setRateFormData(id);
    this.openRateModal('Edit');
  }

  deleteRate = (event: any, id: string) => {
    this.clickedId = id;
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete this?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.api.deleteRate(id).subscribe(res => {
            this.showSuccess('Successfully deleted!', 'Success')
            this.getRatesList();
            this.getTotalRatesCount();
          })
        },
        reject: (type: any) => {
            switch(type) {
                case ConfirmEventType.REJECT:
                  break;
                case ConfirmEventType.CANCEL:
                  break;
            }
        }
    });
  }

  onUpdatedProductSettingsSubmit = async () => {
    if (this.productSettingsForm.invalid) {
      this.validateAllFormFields(this.productSettingsForm)
      return
    }

    let data = {
      account_type: Boolean(this.productSettingsForm.get('accounting_type')?.value),
      local_did_fee: Number(this.productSettingsForm.get('local_did_fee')?.value),
      local_did_setup_fee: Number(this.productSettingsForm.get('local_did_setup_fee')?.value),
      tollfree_fee: Number(this.productSettingsForm.get('toll_free_fee')?.value),
      tollfree_setup_fee: Number(this.productSettingsForm.get('toll_free_setup_fee')?.value),
    }

    await this.api.updateProduct(this.customer_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onBack = () => {
    this.location.back();
  }

  // get created_by username and updated_by username
  getAuditionedUsername = async (auditioned_id: number, callback: (username: string)=>void) => {
    this.api.getAuditionedUsername(auditioned_id).subscribe(async res => {
      callback(res.username);
    })
  }

  onChangeRatesType = (event: any) => {

  }

  //resource group table pagination and sort
  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getGroupsList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => {
    this.pageIndex = 1;
    this.getGroupsList();
  }

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getGroupsList();
  }

  paginate = (event: any) => {
    this.onPagination(event.page+1, event.rows);
  }

  //rate table pagination and sort
  //rate table pagination and sort
  onRateSortChange = async (name: any) => {
    this.rateSortActive = name;
    this.rateSortDirection = this.rateSortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.ratePageIndex = 1;
    await this.getRatesList();
  }

  onRateFilter = (event: Event) => {
    this.ratePageIndex = 1;
    this.rateFilterName = (event.target as HTMLInputElement).name;
    this.rateFilterValue = (event.target as HTMLInputElement).value;
  }

  onRateClickFilter = () => {
    this.ratePageIndex = 1;
    this.getRatesList();
  }

  onRatePagination = async (pageIndex: any, pageRows: number) => {
    this.ratePageSize = pageRows;
    const totalPageCount = Math.ceil(this.rateFilterResultLength / this.ratePageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.ratePageIndex = pageIndex;
    await this.getRatesList();
  }

  ratePaginate = (event: any) => {
    this.onPagination(event.page+1, event.rows);
  }

  //Npanxx Lerg Rate table pagination and sort
  onNpanxxSortChange = async (name: any) => {
    this.npanxxSortActive = name;
    this.npanxxSortDirection = this.npanxxSortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.npanxxPageIndex = 1;
    await this.getLergsRatesList();
  }

  onNpanxxFilter = (event: Event) => {
    this.npanxxPageIndex = 1;
    this.npanxxFilterName = (event.target as HTMLInputElement).name;
    this.npanxxFilterValue = (event.target as HTMLInputElement).value;
  }

  onNpanxxClickFilter = () => this.getLergsRatesList();

  onNpanxxPagination = async (pageIndex: any, pageRows: number) => {
    this.npanxxPageSize = pageRows;
    const totalPageCount = Math.ceil(this.npanxxFilterResultLength / this.npanxxPageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.npanxxPageIndex = pageIndex;
    await this.getLergsRatesList();
  }

  npanxxPaginate = (event: any) => {
    this.onNpanxxPagination(event.page+1, event.rows);
  }

  //TFN Numbers Table Handle
  onTfnNumbersSortChange = async (name: any) => {
    this.tfnNumbersSortActive = name;
    this.tfnNumbersSortDirection = this.tfnNumbersSortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.tfnNumbersPageIndex = 1;
    await this.getTfnNumbersList();
  }

  onTfnNumbersFilter = (event: Event) => {
    this.tfnNumbersPageIndex = 1;
    this.tfnNumbersFilterName = (event.target as HTMLInputElement).name;
    this.tfnNumbersFilterValue = (event.target as HTMLInputElement).value;
  }

  onTfnNumbersClickFilter = () => this.getTfnNumbersList();

  onTfnNumbersPagination = async (pageIndex: any, pageRows: number) => {
    this.tfnNumbersPageSize = pageRows;
    const totalPageCount = Math.ceil(this.tfnNumbersFilterResultLength / this.tfnNumbersPageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.tfnNumbersPageIndex = pageIndex;
    await this.getTfnNumbersList();
  }

  tfnNumbersPaginate = (event: any) => {
    this.onTfnNumbersPagination(event.page+1, event.rows);
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
