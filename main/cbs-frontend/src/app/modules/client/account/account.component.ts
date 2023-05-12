import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import {IUser, IRole} from "../../../models/user";
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { EMAIL_REG_EXP, SUPER_ADMIN_ROLE_ID, TIMEZONE, TIME_FORMATS } from '../../constants';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  accountTabIndex: number = 0;
  loggedUserId: number = -1;
  loggedRoleId: number = -1;

  roles: any[] = [];
  customers: any[] = [];
  timezones: any[] = TIMEZONE
  timeformats: any[] = TIME_FORMATS;
  input_username: any = ''
  validUsername: boolean = true;
  input_customer_id: any = ''
  input_role_id: any = ''
  input_timezone: any = ''
  inputTimeFormat: string = 'MM/DD/YYYY h:mm:ss A';
  input_email: any = ''
  validEmail: boolean = true;
  input_first_name: any = ''
  validFirstName: boolean = true;
  input_last_name: any = ''
  validLastName: boolean = true;
  input_password: string|number|undefined|null = ''
  validPassword: boolean = true;
  input_old_password: string|number|undefined|null = ''
  validOldPassword: boolean = true;
  input_confirm_password: string|number|undefined|null = ''
  input_country: string|number|undefined|null = ''
  input_address: string|number|undefined|null = ''
  input_province: string|number|undefined|null = ''
  input_city: string|number|undefined|null = ''
  input_zip_code: string|number|undefined|null = ''
  input_tel1: string|number|undefined|null = ''
  input_tel2: string|number|undefined|null = ''
  input_mobile: string|number|undefined|null = ''
  input_fax: string|number|undefined|null = ''

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
      this.loggedUserId = state.user.id;
      this.loggedRoleId = state.user.role_id

      this.api.getUser(state.user.id).subscribe(async res => {
        this.input_username = res.username;
        this.input_customer_id = {name: `${res.customer.company_name} (${res.customer.company_id})`, value: res.customer?.id};
        this.input_role_id = {name: res.role?.name, value: res.role?.id};
        this.input_timezone = res.timezone;
        this.inputTimeFormat = res.time_format;
        this.input_email = res.email;
        this.input_first_name = res.first_name;
        this.input_last_name = res.last_name;
        this.input_country = res.userInfo?.country;
        this.input_address = res.userInfo?.address;
        this.input_province = res.userInfo?.province;
        this.input_city = res.userInfo?.city;
        this.input_zip_code = res.userInfo?.zip_code;
        this.input_tel1 = res.userInfo?.tel1;
        this.input_tel2 = res.userInfo?.tel2;
        this.input_mobile = res.userInfo?.mobile;
        this.input_fax = res.userInfo?.fax!=null?res.userInfo?.fax:'';
      })
    })

    this.getRolesList();
    this.getCustomerList();
  }

  createData = (name: string, value: number) => {
    return {
      name,
      value
    };
  }

  getRolesList = async () => {
    try {
      await this.api.getRolesListForFilter()
        .pipe(tap(async (rolesRes: IRole[]) => {
          this.roles = rolesRes.map(item=>{
            return this.createData(
              item.name,
              item.id
            );
          });

          if(this.loggedRoleId != SUPER_ADMIN_ROLE_ID) {
            this.roles = this.roles.filter(item=>item.value!=SUPER_ADMIN_ROLE_ID);
          }
        })).toPromise();
    } catch (e) {
    }
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          this.customers = res.map(item=>this.createData(`${item.company_name} (${item.company_id})`, item.id));
        })).toPromise();
    } catch (e) {
    }
  }

  onInputEmail = () => {
    if(this.input_email!='' && EMAIL_REG_EXP.test(String(this.input_email))) {
      this.validEmail=true;
    } else {
      this.validEmail = false;
    }

  }

  onMainUpdate = async () => {
    let username = this.input_username;
    let customer_id = this.input_customer_id?.value;
    let role_id = this.input_role_id?.value;
    let timezone = this.input_timezone
    let time_format = this.inputTimeFormat;
    let email = this.input_email;
    let first_name = this.input_first_name;
    let last_name = this.input_last_name;

    if(username=='') this.validUsername = false;
    if(email=='') this.validEmail = false;
    if(first_name=='') this.validFirstName = false;
    if(last_name=='') this.validLastName = false;

    if(username==''||customer_id==undefined||role_id==undefined||email==''||first_name==''||last_name=='') {
      return;
    }

    if(!EMAIL_REG_EXP.test(String(this.input_email))) {
      this.validEmail = false;
      return;
    }

    await this.api.updateUserMain(this.loggedUserId, {
      username: username,
      email: email,
      first_name: first_name,
      last_name: last_name,
      customer_id: customer_id,
      role_id: role_id,
      timezone: timezone,
      time_format: time_format
    }).pipe(tap(res=>{
      this.store.storeUser({...this.store.getUser(), username, email: email, first_name, last_name, customer_id, role_id, timezone, time_format});
      this.showSuccess('Successfully Updated!');
    })).toPromise();
  }

  mainReset = () => {
    this.api.getUser(this.loggedUserId).subscribe(async res => {
      this.input_username = res.username;
      this.input_customer_id = {name: `${res.customer.company_name} (${res.customer.company_id})`, value: res.customer?.id};
      this.input_role_id = {name: res.role?.name, value: res.role?.id};
      this.input_timezone = res.timezone
      this.inputTimeFormat = res.time_format;
      this.input_email = res.email;
      this.input_first_name = res.first_name;
      this.input_last_name = res.last_name;
    })
  }

  onPasswordUpdate = async () => {
    if(this.input_password=='') {this.validPassword = false;}
    if(this.input_old_password=='') {this.validOldPassword = false;}
    if(this.input_password==''||this.input_old_password=='') {return}

    if(this.input_password!=this.input_confirm_password) {
      this.showWarn('Please confirm password!')
      return
    }

    await this.api.updateUserPassword(this.loggedUserId, {
      old_password: this.input_old_password,
      new_password: this.input_password
    }).pipe(tap(res=>{
      this.showSuccess('Successfully Updated!');
      this.passwordReset()
    })).toPromise();
  }

  passwordReset = () => {
    this.input_password = ''
    this.validPassword = true;
    this.input_old_password='';
    this.validOldPassword=true
    this.input_confirm_password = ''
  }

  onAdditionalUpdate = async () => {
    let country = this.input_country;
    let address = this.input_address;
    let province = this.input_province;
    let city = this.input_city;
    let zip_code = this.input_zip_code;
    let tel1 = this.input_tel1?.toString();
    let tel2 = this.input_tel2?.toString();
    let mobile = this.input_mobile?.toString();
    let fax = this.input_fax?.toString();

    await this.api.updateUserAdditional(this.loggedUserId, {
      country: country,
      address: address,
      province: province,
      city: city,
      zip_code: zip_code,
      tel1: tel1,
      tel2: tel2,
      mobile: mobile,
      fax: fax,
    }).pipe(tap(res=>{
      this.showSuccess('Successfully Updated!');
    })).toPromise();
  }

  AdditionalReset = () => {
    this.api.getUser(this.loggedUserId).subscribe(async res => {
      this.input_country = res.userInfo?.country;
      this.input_address = res.userInfo?.address;
      this.input_province = res.userInfo?.province;
      this.input_city = res.userInfo?.city;
      this.input_zip_code = res.userInfo?.zip_code;
      this.input_tel1 = res.userInfo?.tel1;
      this.input_tel2 = res.userInfo?.tel2;
      this.input_mobile = res.userInfo?.mobile;
      this.input_fax = res.userInfo?.fax!=null?res.userInfo?.fax:'';
    })
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
