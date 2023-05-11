import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { toBase64 } from 'src/app/helper/utils';
import { PAGE_SIZE_OPTIONS } from '../../constants';

@Component({
  selector: 'app-cdrs',
  templateUrl: './cdrs.component.html',
  styleUrls: ['./cdrs.component.scss']
})
export class CdrsComponent implements OnInit, AfterViewInit {

  @ViewChild('elmnt_sftp_path') elmnt_sftp_path!: ElementRef;

  pageSize = 100
  pageIndex = 1
  import_cdrs: any[] = [];
  filterName = ''
  filterValue = ''
  sortActive = 'id';
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  write_permission: boolean = false;
  flag_openDialog: boolean = false;
  flag_openUploadDialog: boolean = false;
  modalTitle: string = '';
  clickedId: string = '';

  cdrsImportForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    // table_name: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    port: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    path: new FormControl('', [Validators.required]),
    switchCredential: new FormControl(false),
    password: new FormControl(''),
    public_key: new FormControl(''),
    start_date: new FormControl(null, [Validators.required]),
    is_rate: new FormControl(false),
    is_lrn: new FormControl(false),
    is_active: new FormControl(false),
    lnp_server: new FormControl(''),
  });

  inputName: string = '';
  inputTableName: string = '';
  inputAddress: string = '';
  inputPort: string = '';
  inputUsername: string = '';
  inputIsPassword: boolean = false;
  inputPassword: string = '';
  inputPublicKey: string = '';
  inputStartDate: any = null;
  inputIsRate: boolean = false;
  inputIsLrn: boolean = false;
  inputIsActive: boolean = false;
  inputLnpServer: string = '';
  inputPath: string = '';

  uploadActionOptions: any[] = [
    {name: 'Append', value: 'APPEND'},
    {name: 'Update', value: 'UPDATE'},
    {name: 'Delete', value: 'DELETE'},
  ];
  uploadMethod = 'APPEND';

  demoImportCDRs: any[] = [
    {
      called: '8002604701',
      calling: '3102044613',
      starttime: '00:00:03',
      endtime: ' 00:00:03',
      rgout: 129,
      rgin: 122,
      duration: 0,
      successful: 0,
      server: 'entice',
      reason: 408,
      server_ip: '208.73.234.36',
    }
  ];

  input_sftp_path: any = ''
  isSftpEditing: boolean = false

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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.READ_CDRS_IMPORT)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    // this.store.state$.subscribe(async (state)=> {

    // })

    this.getSftpHosts();
    this.getImportCDRsList();
    this.getTotalImportCDRsCount();
  }

  ngAfterViewInit() {
    this.elmnt_sftp_path.nativeElement.select();
  }

  getSftpHosts = async () => {
    await this.api.getSftpHosts().pipe(tap(res=>{
      this.input_sftp_path = res.value;
    })).toPromise();
  }

  isImportCDRsFormFieldValid(field: string) {
    return !this.cdrsImportForm.get(field)?.valid && this.cdrsImportForm.get(field)?.touched;
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

  getImportCDRsList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue;
      await this.api.getImportCDRsList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue)
        .pipe(tap(async (response: any[]) => {
          this.import_cdrs = [];
          response.map(u => {
            // u.created_at = u.created_at ? moment(new Date(u.created_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            // u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('MM/DD/YYYY h:mm:ss A') : '';
            // u.start_date = u.start_date ? moment(new Date(u.start_date)).format('MM/DD/YYYY h:mm:ss A') : '';
            if(Boolean(this.store.getUser()?.timezone)) {
              // Timezone Time
              u.created_at = u.created_at ? moment(u.created_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format('MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(u.updated_at).utc().utcOffset(Number(this.store.getUser()?.timezone)).format('MM/DD/YYYY h:mm:ss A') : '';
              u.start_date = u.start_date ? moment(u.start_date).utc().utcOffset(Number(this.store.getUser()?.timezone)).format('MM/DD/YYYY h:mm:ss A') : '';
            } else {
              // Local time
              u.created_at = u.created_at ? moment(new Date(u.created_at)).format('MM/DD/YYYY h:mm:ss A') : '';
              u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('MM/DD/YYYY h:mm:ss A') : '';
              u.start_date = u.start_date ? moment(new Date(u.start_date)).format('MM/DD/YYYY h:mm:ss A') : '';
            }
          });

          for (let item of response) {
            this.import_cdrs.push(item)
          }
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getImportCDRsCount(filterValue)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalImportCDRsCount = async () => {
    this.resultsLength = -1
    await this.api.getImportCDRsCount('')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }
  
  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    this.flag_openDialog = true
    // if(modal_title.toLowerCase()=='edit') {
    //   this.cdrsImportForm.controls['table_name'].disable();
    // } else {
    //   this.cdrsImportForm.controls['table_name'].enable();
    // }
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  clearInputs = () => {
    this.cdrsImportForm.reset();
  }

  onSubmit = async () => {
    if (this.cdrsImportForm.invalid) {
      this.validateAllFormFields(this.cdrsImportForm)
      return
    }

    if(this.inputIsPassword && this.inputPassword=='') {
      this.showWarn('Please input password!');
      return
    } else if(!this.inputIsPassword && this.inputPublicKey=='') {
      this.showWarn('Please input private key!');
      return
    }

    let name = this.cdrsImportForm.get('name')?.value;
    // let table_name = this.cdrsImportForm.get('table_name')?.value;
    let address = this.cdrsImportForm.get('address')?.value;
    let port = Number(this.cdrsImportForm.get('port')?.value);
    let username = this.cdrsImportForm.get('username')?.value;
    let password = this.cdrsImportForm.get('password')?.value;
    let public_key = this.cdrsImportForm.get('public_key')?.value;
    let start_date = new Date(this.cdrsImportForm.get('start_date')?.value);
    let is_rate = this.cdrsImportForm.get('is_rate')?.value;
    let is_lrn = this.cdrsImportForm.get('is_lrn')?.value;
    let is_active = this.cdrsImportForm.get('is_active')?.value;
    let lnp_server = this.cdrsImportForm.get('lnp_server')?.value;
    let path = this.cdrsImportForm.get('path')?.value;

    let data: any = {
      name: name ? name : '',
      address: address ? address : '',
      port: port ? port : '',
      username: username ? username : '',
      password: this.inputPassword?this.inputPassword:'',
      public_key: this.inputPublicKey?this.inputPublicKey:'',
      start_date: start_date,
      is_rate: Boolean(is_rate),
      is_lrn: Boolean(is_lrn),
      is_active: Boolean(is_active),
      lnp_server: lnp_server ? lnp_server : '',
      path: path ? path : '',
    }

    // data.table_name = table_name ? table_name : '';

    if(this.modalTitle.toLowerCase()=='add') {
      await this.api.createImportCDR(data).pipe(tap(res=>{
        this.showSuccess('Successfully created!', 'Success');
        this.getImportCDRsList();
        this.getTotalImportCDRsCount();
        this.closeModal();
      })).toPromise();
    } else if(this.modalTitle.toLowerCase()=='edit') {
      await this.api.updateImportCDR(this.clickedId, data).pipe(tap(res=>{
        this.getImportCDRsList();
        this.showSuccess('Successfully updated!', 'Success');
        this.closeModal();
      })).toPromise();
    }
  }

  onOpenEditModal = (event: any, id: string) => {
    this.clickedId = id;
    this.api.getImportCDR(id).subscribe(res => {
      this.cdrsImportForm.setValue({
        name: res.name,
        // table_name: res.table_name ? res.table_name : '',
        address: res.address,
        port: res.port,
        username: res.username,
        switchCredential: Boolean(res.password),
        password: res.password,
        public_key: res.public_key,
        start_date: new Date(res.start_date),
        is_rate: res.is_rate,
        is_lrn: res.is_lrn,
        is_active: res.is_active,
        lnp_server: res.lnp_server,
        path: res.path ? res.path : ''
      });
      this.inputPassword = res.password;
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
        this.api.deleteImportCDRById(id).subscribe(res => {
          this.showSuccess('Successfully deleted!', 'Success');
          this.getImportCDRsList();
          this.getTotalImportCDRsCount();
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
      this.api.uploadNPANXX(body).subscribe(res=> {
        if(!res.failed) {
          this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
        } else if(!res.completed) {
          this.showError(`Failed: ${res.failed}  ${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\n${res.message}`);
        } else {
          this.showWarn(`Completed: ${res.completed} \n\nFailed: ${res.failed}  ${res.message!='' ? 'Upload completed for the following reasons!' : ''}  \n\n${res.message}`);
        }
        this.flag_openUploadDialog = false;
      });
    }
  }

  onSFTPEdit = () => {
    setTimeout(()=>{
      // this will make the execution after the above boolean has changed
      this.elmnt_sftp_path.nativeElement.select();
    },0);
    this.isSftpEditing = true;
  }

  onEditedSFTPSave = () => {
    let send_data = JSON.stringify({
      remotePath: this.input_sftp_path
    });
    this.api.updateSftpHosts({
      value: this.input_sftp_path
    }).subscribe(res=> {
      this.showSuccess('Successfully Updated!', 'Success');
    });
  }

  onCancelSFTPEdit = () => {
    this.isSftpEditing = false;
  }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getImportCDRsList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getImportCDRsList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getImportCDRsList();
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
