import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {ConfirmationService, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import { IRole} from "../../../models/user";
import { Router } from '@angular/router';
import { EMAIL_REG_EXP, SUPER_ADMIN_ROLE_ID, TIMEZONE, TIME_FORMATS } from '../../constants';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { USER_TYPE } from 'src/app/consts/types';

@Component({
  selector: 'app-customer-account',
  templateUrl: './customer-account.component.html',
  styleUrls: ['./customer-account.component.scss']
})
export class CustomerAccountComponent implements OnInit {
  accountId: any;
  accountType: any = '';

  companyForm: FormGroup = new FormGroup({
    company_name: new FormControl('', Validators.required),
    company_id: new FormControl('', Validators.required),
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]),
    timezone: new FormControl(),
    time_format: new FormControl('MM/DD/YYYY h:mm:ss A'),
    status: new FormControl('ACTIVE', Validators.required),
  });
  credentialForm: FormGroup = new FormGroup({
    old_password: new FormControl('', Validators.required),
    new_password: new FormControl('', Validators.required),
    confirm_password: new FormControl('',Validators.required),
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

  timezones: any[] = TIMEZONE
  timeformats: any[] = TIME_FORMATS;

  statusOptions: any[] = [
    {name: 'Pending Auth.', value: 'PENDING'},
    {name: 'Active', value: 'ACTIVE'},
    {name: 'Temp On Hold', value: 'TEMP ON HOLD'},
  ];

  inputCompanyName: string = '';
  inputCompanyId: string = '';
  inputFirstName: string = '';
  inputLastName: string = '';
  inputEmail: string = '';
  input_timezone: any = '';
  inputTimeFormat: string = 'MM/DD/YYYY h:mm:ss A';
  inputAddress: string = '';
  inputCity: string = '';
  inputState: string = '';
  inputCountry: string = '';
  inputZip: string = '';
  inputPhone: string = '';
  inputSSN: string = '';
  input_old_password: string = '';
  input_new_password: string = '';
  input_confirm_password: string = '';

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location,
    private confirmationService: ConfirmationService,
    public router: Router
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
      this.accountId = state.user.id;
    })

    if(this.accountType == USER_TYPE.CUSTOMER) {
      this.initCustomer();
    } else if(this.accountType == USER_TYPE.VENDOR) {
      this.initVendor();
    }
  }

  initCustomer = () => {
    this.api.getCustomer(this.store.getUser().id).subscribe(async res => {
      this.companyForm.setValue({
        company_name: res.company_name,
        company_id: res.company_id,
        first_name: res.first_name,
        last_name: res.last_name,
        email: res.email,
        timezone: res.timezone,
        time_format: res.time_format,
        status: res.status
      });
      this.additionalForm.setValue({
        address: res.customerInfo?.address ? res.customerInfo?.address : '',
        city: res.customerInfo?.city ? res.customerInfo?.city : '',
        state: res.customerInfo?.state ? res.customerInfo?.state : '',
        country: res.customerInfo?.country ? res.customerInfo?.country : '',
        zip: res.customerInfo?.zip ? res.customerInfo?.zip : '',
        phone: res.customerInfo?.phone ? res.customerInfo?.phone : '',
        ssn: res.customerInfo?.ssn ? res.customerInfo?.ssn : '',
      });
    })
  }

  initVendor = () => {
    this.api.getVendor(this.store.getUser().id).subscribe(async res => {
      this.companyForm.setValue({
        company_name: res.company_name,
        company_id: res.company_id,
        first_name: res.first_name,
        last_name: res.last_name,
        email: res.email,
        timezone: res.timezone ? res.timezone : '',
        time_format: res.time_format ? res.time_format : '',
        status: res.status
      });
      this.additionalForm.setValue({
        address: res.customerInfo?.address ? res.customerInfo?.address : '',
        city: res.customerInfo?.city ? res.customerInfo?.city : '',
        state: res.customerInfo?.state ? res.customerInfo?.state : '',
        country: res.customerInfo?.country ? res.customerInfo?.country : '',
        zip: res.customerInfo?.zip ? res.customerInfo?.zip : '',
        phone: res.customerInfo?.phone ? res.customerInfo?.phone : '',
        ssn: res.customerInfo?.ssn ? res.customerInfo?.ssn : '',
      });
    })
  }

  isCompanyFormFieldValid(field: string) {
    return !this.companyForm.get(field)?.valid && this.companyForm.get(field)?.touched;
  }

  isCredentialFormFieldValid(field: string) {
    return !this.credentialForm.get(field)?.valid && this.credentialForm.get(field)?.touched;
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
      timezone: this.companyForm.get('timezone')?.value,
      time_format: this.companyForm.get('time_format')?.value,
      status: this.companyForm.get('status')?.value,
    }

    if(this.accountType == USER_TYPE.CUSTOMER) {
      await this.api.updateCompany(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    } else if(this.accountType == USER_TYPE.VENDOR) {
      await this.api.updateVendorCompany(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    }
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

    if(this.accountType == USER_TYPE.CUSTOMER) {
      await this.api.updateAdditional(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    } else if(this.accountType == USER_TYPE.VENDOR) {
      await this.api.updateVendorAdditional(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    }
  }

  onUpdatedCredentialSubmit = async () => {
    if (this.credentialForm.invalid) {
      this.validateAllFormFields(this.credentialForm)
      return
    }

    if(this.credentialForm.get('new_password')?.value != this.credentialForm.get('confirm_password')?.value) {
      this.showWarn('Please confirm password');
      return
    }

    let data = {
      old_password: this.credentialForm.get('old_password')?.value,
      new_password: this.credentialForm.get('new_password')?.value,
    }

    if(this.accountType == USER_TYPE.CUSTOMER) {
      await this.api.updateCustomerAccountPassword(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    } else if(this.accountType == USER_TYPE.VENDOR) {
      await this.api.updateVendorAccountPassword(this.accountId, data).pipe(tap(res=>{
        this.showSuccess('Successfully updated!');
      })).toPromise();
    }
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
