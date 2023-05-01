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
  selector: 'app-lrn',
  templateUrl: './lrn.component.html',
  styleUrls: ['./lrn.component.scss']
})
export class LrnComponent implements OnInit {

  pageSize = 100
  pageIndex = 1
  filterName = ''
  filterValue = ''
  sortActive = 'calling';
  sortDirection = 'ASC'
  resultsLength = -1
  filterResultLength = -1;
  isLoading = true
  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  lrns: any[] = []
  
  write_permission: boolean = false;
  flag_openDialog: boolean = false;
  flag_openUploadDialog: boolean = false;
  modalTitle: string = '';
  clickedId: string = '';

  lrnForm: FormGroup = new FormGroup({
    calling: new FormControl('', [Validators.required, Validators.pattern(RegExp('^\\d{3}(\\d{7}|\\-\\d{3}\\-\\d{4})$'))]),
    translated: new FormControl('', [Validators.required, Validators.pattern(RegExp('^\\d{3}(\\d{7}|\\-\\d{3}\\-\\d{4})$'))]),
    lata: new FormControl(''),
    thousand: new FormControl(''),
  });

  inputCalling: string = '';
  inputTranslated: string = '';
  inputLata: string = '';
  inputThousand: string = '';

  users: any[] = [];

  // uploadActionOptions: any[] = [
  //   {name: 'Append', value: 'APPEND'},
  //   {name: 'Update', value: 'UPDATE'},
  //   {name: 'Delete', value: 'DELETE'},
  // ];
  // uploadMethod = 'APPEND';
  // isUpLoading: boolean = false;

  // uploadDemoContent: any[] = [
  //   {
  //     calling: '8002055803',
  //     translated: '8002055803',
  //     lata: '',
  //     thousand: '',
  //   }
  // ];

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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.READ_LRN_MANAGEMENT)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    // this.store.state$.subscribe(async (state)=> {
      
    // })

    await this.getUsers();
    // await this.getLrnsList();
    // await this.getTotalLrnCount();
  }

  isLrnFormFieldValid(field: string) {
    return !this.lrnForm.get(field)?.valid && this.lrnForm.get(field)?.touched;
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  
  getLrnsList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue;

      await this.api.getLrnsList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue)
        .pipe(tap(async (response: any[]) => {
          this.lrns = [];
          // response.map(u => {
          //   u.created_at = u.created_at ? moment(new Date(u.created_at)).format('MM/DD/YYYY h:mm:ss A') : '';
          //   u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('MM/DD/YYYY h:mm:ss A') : '';
          //   u.created_by = u.created_by ? this.users.find(item=>item.id==u.created_by)?.username : '';
          //   u.updated_by = u.updated_by ? this.users.find(item=>item.id==u.updated_by)?.username : '';
          // });

          this.lrns = response;
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getLrnCount(filterValue)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalLrnCount = async () => {
    this.resultsLength = -1
    await this.api.getLrnCount('')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  getUsers = async () => {
    this.api.getUsersListForFilter().subscribe(res=>{
      this.users = res;
    });
  }

  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    if(modal_title.toLowerCase()=='edit') {
      this.lrnForm.controls['calling'].disable();
    } else {
      this.lrnForm.controls['calling'].enable();
    }
    this.flag_openDialog = true
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  clearInputs = () => {
    this.lrnForm.reset();
  }

  onSubmit = async () => {
    if (this.lrnForm.invalid) {
      this.validateAllFormFields(this.lrnForm)
      return
    }

    let calling = this.lrnForm.get('calling')?.value;
    let translated = this.lrnForm.get('translated')?.value;
    let lata = this.lrnForm.get('lata')?.value;
    let thousand = this.lrnForm.get('thousand')?.value;

    let data = {
      calling: calling ? calling : '',
      translated: translated ? translated : '',
      lata: lata ? lata : '',
      thousand: thousand ? thousand : '',
    }

    if(this.modalTitle.toLowerCase()=='add') {
      await this.api.createLrn(data).pipe(tap(res=>{
        this.showSuccess('Successfully created!', 'Success');
        this.getLrnsList();
        this.getTotalLrnCount();
      })).toPromise();
    } else if(this.modalTitle.toLowerCase()=='edit') {
      await this.api.updateLrn(this.clickedId, data).pipe(tap(res=>{
        this.getLrnsList();
        this.showSuccess('Successfully updated!', 'Success');
      })).toPromise();
    }

    this.closeModal();
  }

  onOpenEditModal = (event: any, id: string) => {
    this.clickedId = id;
    this.api.getLrn(id).subscribe(async res => {
      this.lrnForm.setValue({
        calling: res.calling,
        translated: res.translated,
        lata: res.lata,
        thousand: res.thousand,
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
        this.api.deleteLrnById(id).subscribe(res => {
          this.showSuccess('Successfully deleted!', 'Success');
          this.getLrnsList();
          this.getTotalLrnCount();
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

  // onClickUpload = (event: Event) => {
  //   let input: any = (event.target as HTMLInputElement);
  //   input.value = null;
  // }

  // changeListener = async (event: any) => {
  //   if (event.target.files && event.target.files.length > 0) {
  //     this.isUpLoading = true;
  //     try {
  //       let file: File = event.target.files.item(0)
  //       const items = file.name.split('.')
  //       let file_extension = items[items.length - 1]
  //       let encoded_file: any = await toBase64(file)
  //       encoded_file = encoded_file.split(',')[1];
  //       if(encoded_file.length > 1024*1024*25) {
  //         this.showWarn('Please select the csv that file size are less than 25MB');
  //         return;
  //       }
  //       let body: any = {
  //         method: this.uploadMethod,
  //         encoded_file: encoded_file,
  //         extension: file_extension
  //       };
  //       this.api.uploadLrns(body).subscribe(res=> {
  //         if(!res.failed) {
  //           this.showSuccess('Successfully Uploaded!', 'Total: '+ res.completed);
  //         } else if(!res.completed) {
  //           this.showError(`Failed: ${res.failed}  ${res.message!='' ? 'Upload failed for the following reasons!' : ''} \n\n${res.message}`);
  //         } else {
  //           this.showWarn(`Completed: ${res.completed} \n\nFailed: ${res.failed}  ${res.message!='' ? 'Upload completed for the following reasons!' : ''} \n\n${res.message}`);
  //         }
          
  //         this.flag_openUploadDialog = false;
  //         this.getLrnsList();
  //         this.getTotalLrnCount();
  //       });
  //     } catch (e) {
  //     } finally {
  //       setTimeout(() => this.isUpLoading = false, 1000);
  //     }
  //   }
  // }

  onSortChange = async (name: any) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getLrnsList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getLrnsList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getLrnsList();
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
