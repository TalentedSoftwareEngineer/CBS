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
import { EMAIL_REG_EXP, PAGE_SIZE_OPTIONS, SUPER_ADMIN_ROLE_ID, TIMEZONE, TIME_FORMATS } from '../../constants';

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit {

  // users variables
  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  roleFilterValue = {name: 'All', value: ''}
  statusFilterValue = {name: 'All', value: ''}
  sortActive = 'id' //sortActive = {table field name}
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS
  isLoading = true

  users: any[] = []
  filter_roles: any[] = []
  filter_status: any[] = [
    {name: 'All', value: ''},
    {name: '✔︎ Active', value: true},
    {name: '✖︎ Inactive', value: false}
  ];
  filterCustomerOptions: any[] = [];
  customerFilterValue: number|string = '';
  roles: any[] = [];
  timezones: any[] = TIMEZONE
  timeformats: any[] = TIME_FORMATS;
  customers: any[] = [];

  noNeedEditColumn = false

  flag_openDialog = false

  //user items
  input_username: string|number|undefined|null = ''
  validUsername: boolean = true;
  input_customer_id: any = ''
  input_role_id: any = ''
  input_timezone: any = ''
  inputTimeFormat: string = 'MM/DD/YYYY h:mm:ss A';
  input_email: string|number|undefined|null = ''
  validEmail: boolean = true;
  input_first_name: string|number|undefined|null = ''
  validFirstName: boolean = true;
  input_last_name: string|number|undefined|null = ''
  validLastName: boolean = true;
  input_password: string|number|undefined|null = ''
  validPassword: boolean = true;
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

  modalTitle = '';

  clickedId = -1;

  required = true;

  write_permission: boolean = false;
  authUserId = -1;

  allUsers: any[] = [];



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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.READ_USERS)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    this.store.state$.subscribe(async (state)=> {
      if(state.user.permissions?.indexOf(PERMISSIONS.WRITE_USERS) == -1)
        this.write_permission = false;
      else
        this.write_permission = true;

      this.authUserId = state.user.id;
    })

    await this.getAllUsers();
    this.getUsersList();
    this.getTotalUsersCount();
    this.getRolesList();
    this.getCustomerList();
  }

  getAllUsers = async () => {
    await this.api.getUsersListForFilter()
    .pipe(tap(async (res: IUser[]) => {
      this.allUsers = res;
    })).toPromise();
  }

  createData = (name: string, value: number) => {
    return {
      name,
      value
    };
  }

  getUsersList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue

      await this.api.getUsersList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, this.roleFilterValue.value, this.statusFilterValue.value)
        .pipe(tap(async (usersRes: IUser[]) => {
          this.users = [];
          usersRes.map(u => {
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
            u.created_by = u.created_by ? this.allUsers.find((item: any) => item.id==u.created_by)?.username : '';
            u.updated_by = u.updated_by ? this.allUsers.find((item: any) => item.id==u.updated_by)?.username  : '';
          });

          for (let user of usersRes) {
            this.users.push(user)
          }
        })).toPromise();

      this.filterResultLength = -1
      await this.api.getUserCount(filterValue, this.roleFilterValue.value, this.statusFilterValue.value).pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalUsersCount = async () => {
    this.resultsLength = -1
    await this.api.getUserCount('', '', '').pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
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

          this.roles.splice(this.roles.findIndex(item=>item.value==SUPER_ADMIN_ROLE_ID), 1);
          this.filter_roles = [{name: 'All', value: ''}, ...this.roles];
        })).toPromise();
    } catch (e) {
    }
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          this.customers = res.map(item=>this.createData(`${item.company_name} (${item.company_id})`, item.id));
          this.filterCustomerOptions = [{name: 'All', value: ''}, ...res.map(item=>this.createData(`${item.company_name} (${item.company_id})`, item.id))];
          this.customerFilterValue = this.filterCustomerOptions[0].value;
        })).toPromise();
    } catch (e) {
    }
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getUsersList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => {
    this.pageIndex = 1;
    this.getUsersList();
  }

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getUsersList();
  }

  paginate = (event: any) => {
    this.onPagination(event.page+1, event.rows);
  }

  openUserModal = (modal_title: string) => {
    this.modalTitle = modal_title
    this.flag_openDialog = true
  }

  closeUserModal = () => {
    this.clearInputs();
    this.flag_openDialog = false;
  }

  onUserSubmit = async () => {
    let username =  this.input_username;
    let email =  this.input_address;
    let first_name =  this.input_first_name;
    let last_name =  this.input_last_name;
    let customer_id = this.input_customer_id.value;
    let role_id = this.input_role_id.value;
    let timezone = this.input_timezone;
    let time_format = this.inputTimeFormat
    let password = this.input_password;
    let confirm_password = this.input_confirm_password;
    let country = this.input_country;
    let address =  this.input_address;
    let province =  this.input_province;
    let city =  this.input_city;
    let zip_code =  this.input_zip_code;
    let tel1 =  this.input_tel1;
    let tel2 =  this.input_tel2;
    let mobile =  this.input_mobile;
    let fax =  this.input_fax;

    if(username=='') this.validUsername = false;
    if(email=='') this.validEmail = false;
    if(first_name=='') this.validFirstName = false;
    if(last_name=='') this.validLastName = false;
    if(password=='') this.validPassword = false;

    if(username==''||customer_id==undefined||role_id==undefined||email==''||first_name==''||last_name==''||password=='') {
      return;
    }

    if(!EMAIL_REG_EXP.test(String(this.input_email))) {
      this.validEmail = false;
      return;      
    }

    if(password != confirm_password) {
      this.showInfo('Please confirm password');
      return;
    }

    await new Promise<void>(resolve => {
      this.api.createUser({
        username: username,
        customer_id: customer_id,
        role_id: role_id,
        timezone: timezone,
        time_format: time_format,
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: password,
        country: country,
        address: address,
        province: province,
        city: city,
        zip_code: zip_code,
        tel1: tel1?.toString(),
        tel2: tel2?.toString(),
        mobile: mobile?.toString(),
        fax: fax?.toString(),
      }).subscribe(res => {
        resolve()
      });
    })

    this.showSuccess('Successfully created!');
    this.closeUserModal();
    this.getUsersList();
    this.getTotalUsersCount();
  }

  viewUser = (event: Event, user_id: number) => {
    this.clickedId = user_id;

    this.api.updateUserStatus(user_id).subscribe(res => {
      this.showSuccess('User Status successfully updated!')
      this.getUsersList();
    })
  }

  onOpenEditModal = async (event: Event, user_id: number) => {
    this.clickedId = user_id;
    this.api.getUser(user_id).subscribe(async res => {
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

      this.openUserModal('Edit');
    })
  }

  deleteUser = (event: Event, user_id: number) => {
    this.clickedId = user_id;
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete this user?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.api.deleteUserById(user_id).subscribe(res => {
            this.showSuccess('Successfully deleted!')
            this.getUsersList();
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
    this.input_username = ''
    this.input_customer_id = undefined
    this.input_role_id = undefined
    this.input_timezone = ''
    this.inputTimeFormat = 'MM/DD/YYYY h:mm:ss A'
    this.input_email = ''
    this.input_first_name = ''
    this.input_last_name = ''
    this.input_password = ''
    this.input_confirm_password = ''
    this.input_country = ''
    this.input_address = ''
    this.input_province = ''
    this.input_city = ''
    this.input_zip_code = ''
    this.input_tel1 = ''
    this.input_tel2 = ''
    this.input_mobile = ''
    this.input_fax = ''
    this.validUsername = true;
    this.validEmail = true;
    this.validFirstName = true;
    this.validLastName = true;
    this.validPassword = true;
  }

  // get created_by username and updated_by username
  getAuditionedUsername = async (auditioned_id: number, callback: (username: string)=>void) => {
    this.api.getAuditionedUsername(auditioned_id).subscribe(async res => {
      callback(res.username);
    })
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
    let timezone = this.input_timezone;
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

    await this.api.updateUserMain(this.clickedId, {
      username: username,
      email: email,
      first_name: first_name,
      last_name: last_name,
      customer_id: customer_id,
      role_id: role_id,
      timezone: String(timezone),
      time_format: time_format
    }).pipe(tap(res=>{
      this.showSuccess('Successfully Updated!');
      this.closeUserModal();
      this.getUsersList();
    })).toPromise();
  }

  mainReset = () => {
    this.api.getUser(this.clickedId).subscribe(async res => {
      this.input_username = res.username;
      this.input_customer_id = {name: `${res.customer.company_name} (${res.customer.company_id})`, value: res.customer?.id};
      this.input_role_id = {name: res.role?.name, value: res.role?.id};
      this.input_timezone = res.timezone;
      this.inputTimeFormat = res.time_format;
      this.input_email = res.email;
      this.input_first_name = res.first_name;
      this.input_last_name = res.last_name;
    })
  }

  onPasswordUpdate = async () => {
    let password = this.input_password;
    if(password=='') {
      this.validPassword = false;
      return;
    }
    if(this.input_password != this.input_confirm_password) {
      this.showWarn('Please confirm password');
      return;
    }

    if(this.input_password!=this.input_confirm_password) {
      this.showWarn('Please confirm password!')
      return
    }

    await this.api.updateUserPassword(this.clickedId, {
      old_password: "",
      new_password: password
    }).pipe(tap(res=>{
      this.showSuccess('Successfully Updated!');
      this.closeUserModal();
      this.getUsersList();
    })).toPromise();
  }

  passwordReset = () => {
    this.input_password = ''
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

    await this.api.updateUserAdditional(this.clickedId, {
      country: country,
      address: address,
      province: province,
      city: city,
      zip_code: zip_code,
      tel1: tel1,
      tel2: tel2,
      mobile: mobile,
      fax: fax,
      // contact_name: contact_name,
      // contact_number: contact_number,
    }).pipe(tap(res=>{
      this.showSuccess('Successfully Updated!');
      this.closeUserModal();
      this.getUsersList();
    })).toPromise();
  }

  AdditionalReset = () => {
    this.api.getUser(this.clickedId).subscribe(async res => {
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
