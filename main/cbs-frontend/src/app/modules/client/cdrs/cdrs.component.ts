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
import { toBase64 } from 'src/app/helper/utils';

@Component({
  selector: 'app-cdrs',
  templateUrl: './cdrs.component.html',
  styleUrls: ['./cdrs.component.scss']
})
export class CdrsComponent implements OnInit {

  pageSize = 10
  pageIndex = 1
  import_cdrs: any[] = [];
  filterName = ''
  filterValue = ''
  sortActive = 'id';
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = [10, 20, 30, 40, 50];

  write_permission: boolean = false;
  flag_openDialog: boolean = false;
  flag_openUploadDialog: boolean = false;
  modalTitle: string = '';
  clickedId: string = '';

  cdrsImportForm: FormGroup = new FormGroup({
    called: new FormControl('', [Validators.required]),
    calling: new FormControl('', [Validators.required]),
    starttime: new FormControl('', [Validators.required]),
    endtime: new FormControl('', [Validators.required]),
    rgout: new FormControl('', [Validators.required]),
    rgin: new FormControl('', [Validators.required]),
    duration: new FormControl(''),
    successful: new FormControl(''),
    server: new FormControl(''),
    reason: new FormControl(''),
    server_ip: new FormControl(''),
  });

  inputCalled: string = '';
  inputCalling: string = '';
  inputStartTime: string = '';
  inputEndTime: string = '';
  inputRgOut: string = '';
  inputRgIn: string = '';
  inputDuration: string = '';
  inputSuccessful: string = '';
  inputServer: string = '';
  inputReason: string = '';
  inputServerIp: string = '';

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

    this.store.state$.subscribe(async (state)=> {
      if(state.user.permissions?.includes(PERMISSIONS.READ_CDRS_IMPORT)) {
      } else {
        // no permission
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
        this.router.navigateByUrl(ROUTES.dashboard.system_overview)
        return
      }
      
    })

    // this.getImportCDRsList();
    // this.getTotalImportCDRsCount();
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
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('YYYY/MM/DD h:mm:ss A') : '';
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

    let called = this.cdrsImportForm.get('called')?.value;
    let calling = this.cdrsImportForm.get('calling')?.value;
    let starttime = this.cdrsImportForm.get('starttime')?.value;
    let endtime = this.cdrsImportForm.get('endtime')?.value;
    let rgout = this.cdrsImportForm.get('rgout')?.value;
    let rgin = this.cdrsImportForm.get('rgin')?.value;
    let duration = this.cdrsImportForm.get('duration')?.value;
    let successful = this.cdrsImportForm.get('successful')?.value;
    let server = this.cdrsImportForm.get('server')?.value;
    let reason = this.cdrsImportForm.get('reason')?.value;
    let server_ip = this.cdrsImportForm.get('server_ip')?.value;

    let data = {
      called: called ? called : '',
      calling: calling ? calling : '',
      starttime: starttime ? starttime : '',
      endtime: endtime ? endtime : '',
      rgout: rgout ? rgout : '',
      rgin: rgin ? rgin : '',
      duration: duration ? duration : '',
      successful: successful ? successful : '',
      server: server ? server : '',
      reason: reason ? reason : '',
      server_ip: server_ip ? server_ip : '',
    }

    if(this.modalTitle.toLowerCase()=='add') {
      await this.api.createImportCDR(data).pipe(tap(res=>{
        this.showSuccess('Successfully created!', 'Success');
        this.getImportCDRsList();
        this.getTotalImportCDRsCount();
      })).toPromise();
    } else if(this.modalTitle.toLowerCase()=='edit') {
      await this.api.updateImportCDR(this.clickedId, data).pipe(tap(res=>{
        this.getImportCDRsList();
        this.showSuccess('Successfully updated!', 'Success');
      })).toPromise();
    }

    this.closeModal();
  }

  onOpenEditModal = (event: any, id: string) => {
    this.clickedId = id;
    this.api.getImportCDR(id).subscribe(async res => {
      this.cdrsImportForm.setValue({
        called: res.called,
        calling: res.calling,
        starttime: res.starttime,
        endtime: res.endtime,
        rgout: res.rgout,
        rgin: res.rgin,
        duration: res.duration,
        successful: res.successful,
        server: res.server,
        reason: res.reason,
        server_ip: res.server_ip,
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
          this.showInfo(`${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\nFailed: ${res.failed} \n\n${res.message}`);
        } else {
          this.showInfo(`Completed Upload!\n\nCompleted: ${res.commented} \n\nFailed: ${res.failed} \n\n${res.message}`);
        }
        this.flag_openUploadDialog = false;
      });
    }
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
