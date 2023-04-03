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

@Component({
  selector: 'app-vendor-edit',
  templateUrl: './vendor-edit.component.html',
  styleUrls: ['./vendor-edit.component.scss']
})
export class VendorEditComponent implements OnInit {

  //resource group table
  pageSize = 15
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'id' //sortActive = {table field name}
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  rowsPerPageOptions: any[] = [10, 20, 30, 40, 50]
  isLoading = true

  //rate table
  ratePageSize = 10
  ratePageIndex = 1
  rateFilterName = ''
  rateFilterValue = ''
  rateSortActive = 'id' //sortActive = {table field name}
  rateSortDirection = 'ASC'
  rateResultsLength = -1
  rateFilterResultLength = -1;
  rateRowsPerPageOptions: any[] = [10, 20, 30, 40, 50]
  rateIsLoading = false;

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
    partition_id: new FormControl('', Validators.required),
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
    npanxx: new FormControl('', Validators.required),
    lata: new FormControl('', Validators.required),
    ocn: new FormControl('', Validators.required),
    loc_state: new FormControl('', Validators.required),
    ocn_name: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    intra_rate: new FormControl('', Validators.required),
    inter_rate: new FormControl('', Validators.required),
    init_dur: new FormControl('', Validators.required),
    succ_dur: new FormControl('', Validators.required),
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
    {name: '1 Day', value: 1},
    {name: '2 Days', value: 2},
    {name: '3 Days', value: 3},
    {name: '4 Days', value: 4},
    {name: '5 Days', value: 5},
    {name: '6 Days', value: 6},
    {name: '7 Days', value: 7},
    {name: '8 Days', value: 8},
    {name: '9 Days', value: 9},
    {name: '10 Days', value: 10},
    {name: '11 Days', value: 11},
    {name: '12 Days', value: 12},
    {name: '13 Days', value: 13},
    {name: '14 Days', value: 14},
    {name: '15 Days', value: 15},
    {name: '16 Days', value: 16},
    {name: '17 Days', value: 17},
    {name: '18 Days', value: 18},
    {name: '19 Days', value: 19},
    {name: '20 Days', value: 20},
    {name: '21 Days', value: 21},
    {name: '22 Days', value: 22},
    {name: '23 Days', value: 23},
    {name: '24 Days', value: 24},
    {name: '25 Days', value: 25},
    {name: '26 Days', value: 26},
    {name: '27 Days', value: 27},
    {name: '28 Days', value: 28},
    {name: '29 Days', value: 29},
    {name: '30 Days', value: 30},
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
      npanxx: '201200',
      lata: '224',
      ocn: '9206',
      loc_state: 'NJ',
      ocn_name: 'VERIZON NEW JERSEY, INC.',
      category: 'RBOC',
      rate: '0.01078'
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

  isFlatRate: boolean = true;

  vendor_id: number = -1;
  clickedId = '';

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

    this.store.state$.subscribe(async (state)=> {
      if(state.user.permissions?.includes(PERMISSIONS.WRITE_VENDORS)) {
      } else {
        // no permission
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
        this.router.navigateByUrl(ROUTES.dashboard.system_overview)
        return
      }
    })

    await new Promise<void>(resolve=> {
      this.activatedRoute.queryParams.subscribe((params) => {
        this.vendor_id = params['vendor_id'];
        resolve();
      });
    });

    this.initCustomer();
    this.getGroupsList();
    this.getTotalUsersCount();

    this.getRatesList();
    this.getTotalRatesCount();
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

      await this.api.getVendorGroupsList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, this.directionFilterValue, this.statusFilterValue, this.vendor_id)
        .pipe(tap(async (groupsRes: any[]) => {
          this.groups = [];
          groupsRes.map(u => {
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.created_by = u.created_by ? this.getAuditionedUsername(u.created_by, username=>{u.created_by=username}) : '';
            u.updated_by = u.updated_by ? this.getAuditionedUsername(u.updated_by, username=>u.updated_by=username) : '';
          });

          for (let group of groupsRes) {
            this.groups.push(group)
          }

        })).toPromise();

      this.filterResultLength = -1
      await this.api.getVendorGroupsCount(filterValue, this.directionFilterValue, this.statusFilterValue, this.vendor_id).pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalUsersCount = async () => {
    this.resultsLength = -1
    await this.api.getVendorGroupsCount('', '', '', this.vendor_id).pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getRatesList = async () => {
    this.rateIsLoading = true;
    try {
      let rateFilterValue = this.rateFilterValue

      await this.api.getVendorRatesList(this.rateSortActive, this.rateSortDirection, this.ratePageIndex, this.ratePageSize, rateFilterValue, this.vendor_id)
        .pipe(tap(async (ratesRes: any[]) => {
          this.rates = [];
          ratesRes.map(u => {
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.created_by = u.created_by ? this.getAuditionedUsername(u.created_by, username=>{u.created_by=username}) : '';
            u.updated_by = u.updated_by ? this.getAuditionedUsername(u.updated_by, username=>u.updated_by=username) : '';
          });

          for (let rate of ratesRes) {
            this.rates.push(rate)
          }

        })).toPromise();

      this.rateFilterResultLength = -1
      await this.api.getVendorRatesCount(rateFilterValue, this.vendor_id).pipe(tap( res => {
        this.rateFilterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.rateIsLoading = false, 1000);
    }
  }

  getTotalRatesCount = async () => {
    this.rateResultsLength = -1
    await this.api.getVendorRatesCount('', this.vendor_id).pipe(tap( res => {
      this.rateResultsLength = res.count
    })).toPromise();
  }

  initCustomer = () => {
    this.api.getVendor(this.vendor_id).subscribe(async res => {
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

      this.inputFlatRate = res.flat_rate;
      this.inputDefaultRate = res.default_rate;
      this.inputInidur = res.init_duration;
      this.inputSuccdur = res.succ_duration;

      this.setVendorRateFormDefault();
    })
  }

  setVendorRateFormDefault = () => {
    this.api.getVendorRateDefault(this.vendor_id).subscribe(res=> {
      this.rateForm.setValue({
        npanxx: '',
        lata: '',
        ocn: '',
        loc_state: '',
        ocn_name: '',
        category: '',
        intra_rate: res.rate ? res.rate : '',
        inter_rate: res.rate ? res.rate : '',
        init_dur: res.init_duration ? res.init_duration : '',
        succ_dur: res.succ_duration ? res.succ_duration : '',
      });
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

    await this.api.updateVendorCompany(this.vendor_id, data).pipe(tap(res=>{
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

    await this.api.updateVendorCredential(this.vendor_id, data).pipe(tap(res=>{
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

    await this.api.updateVendorAdditional(this.vendor_id, data).pipe(tap(res=>{
      this.showSuccess('Successfully updated!', 'Success');
    })).toPromise();
  }

  onUpdatedPrimarySubmit = async () => {
    this.isFlatRate = this.selectRateType=='FIXED'
    return;
    if (this.primaryRateForm.invalid) {
      this.validateAllFormFields(this.primaryRateForm)
      return
    }

    let customer_info = await new Promise<any>(resolve=> {
      this.api.getVendor(this.vendor_id).subscribe(async res => {
        resolve(res);
      })
    });

    let data: any = {
      company_id: customer_info.company_id,
      company_name: customer_info.company_name,
      first_name: customer_info.first_name,
      last_name: customer_info.last_name,
      email: customer_info.email,
      status: customer_info.status,
      rate: Number(this.inputDefaultRate),
      init_duration: Number(this.inputInidur),
      succ_duration: Number(this.inputSuccdur),
    }

    if(this.selectRateType=='FIXED') {
      data.flat_rate = this.inputFlatRate;
    }

    await this.api.updateVendorCompany(this.vendor_id, data).pipe(tap(res=>{
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
    await this.api.updateVendorBilling(this.vendor_id, data).pipe(tap(res=>{
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

  onGenerate = () => {

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
          this.api.deleteVendorResourceGroup(id).subscribe(res => {
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
      this.api.createVendorResourceGroup(this.vendor_id, data).subscribe(res=> {
        this.showSuccess('Successfully created!', 'Success');
        this.closeModal();
        this.getGroupsList();
        this.getTotalUsersCount();
      });
    } else {
      this.api.updateVendorResourceGroup(this.clickedId, data).subscribe(res=> {
        this.showSuccess('Successfully updated!', 'Success');
        this.closeModal();
        this.getGroupsList();
        this.getTotalUsersCount();
      });
    }
  }
  
  setResourceGroupFormData = (id: string) => {
    return new Promise<void>(resolve=>{
      this.api.getVendorResourceGroup(id).subscribe(res=> {
        this.resourceGroupForm.setValue({
          rgid: res.rgid ? res.rgid : '',
          description: res.description ? res.description : '',
          partition_id: res.partition_id ? res.partition_id : '',
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
      this.api.getVendorRate(id).subscribe(res=> {
        this.rateForm.setValue({
          npanxx: res.npanxx,
          lata: res.lata,
          ocn: res.ocn,
          loc_state: res.state,
          ocn_name: res.ocn_name,
          category: res.category,
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
      this.api.uploadVendorResourceGroup(this.vendor_id, body).subscribe(res=> {
        if(!res.failed) {
          this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
        } else if(!res.completed) {
          this.showInfo(`${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\nFailed: ${res.failed} \n\n${res.message}`);
        } else {
          this.showInfo(`Completed Upload!\n\nCompleted: ${res.commented} \n\nFailed: ${res.failed} \n\n${res.message}`);
        }
        this.getGroupsList();
        this.getTotalUsersCount();
        this.closeUploadModal();
      });
    }
  }

  changeRateListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
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
      this.api.uploadVendorRate(this.vendor_id, body).subscribe(res=> {
        if(!res.failed) {
          this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
        } else if(!res.completed) {
          this.showInfo(`${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\nFailed: ${res.failed} \n\n${res.message}`);
        } else {
          this.showInfo(`Completed Upload!\n\nCompleted: ${res.commented} \n\nFailed: ${res.failed} \n\n${res.message}`);
        }
        this.getRatesList();
        this.getTotalRatesCount();
        this.flag_openRateUploadDialog = false;
      });
    }
  }

  openRateModal = (rateModalTitle: string) => {
    this.setVendorRateFormDefault();
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

    let data: any = {
      npanxx: this.rateForm.get('npanxx')?.value,
      lata: this.rateForm.get('lata')?.value,
      ocn: this.rateForm.get('ocn')?.value,
      state: this.rateForm.get('loc_state')?.value,
      ocn_name: this.rateForm.get('ocn_name')?.value,
      category: this.rateForm.get('category')?.value,
      intra_rate: Number(this.rateForm.get('intra_rate')?.value),
      inter_rate: Number(this.rateForm.get('inter_rate')?.value),
      init_duration: Number(this.rateForm.get('init_dur')?.value),
      succ_duration: Number(this.rateForm.get('succ_dur')?.value),
    }

    if(rateModalTitle == 'Add') {
      // debugger;
      this.api.createVendorRate(this.vendor_id, data).subscribe(res=> {
        this.showSuccess('Successfully created!', 'Success');
        this.closeRateModal();
        this.getRatesList();
        this.getTotalRatesCount();
      });
    } else if(rateModalTitle=='Edit') {
      this.api.updateVendorRate(this.clickedId, data).subscribe(res=> {
        this.showSuccess('Successfully updated!', 'Success');
        this.closeRateModal();
        this.getRatesList();
        this.getTotalRatesCount();
      });
    } else {
      this.showInfo('Please Input again.');
    }
  }

  onOpenRateEditModal = async (event: any, id: string) => {
    this.clickedId = id;
    this.rateModalTitle = 'Edit';
    await this.setRateFormData(id);
    this.flag_openRateDialog = true;
  }

  deleteRate = (event: any, id: string) => {
    this.clickedId = id;
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete this?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.api.deleteVendorRate(id).subscribe(res => {
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
    this.onRatePagination(event.page+1, event.rows);
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
