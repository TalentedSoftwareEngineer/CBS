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
  selector: 'app-lerg',
  templateUrl: './lerg.component.html',
  styleUrls: ['./lerg.component.scss']
})
export class LergComponent implements OnInit {

  pageSize = 10
  pageIndex = 1
  npanxx: any[] = []
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

  npanxxForm: FormGroup = new FormGroup({
    npanxx: new FormControl('', [Validators.required]),
    lata: new FormControl('', [Validators.required]),
    lata_name: new FormControl(''),
    ocn: new FormControl('', [Validators.required]),
    ocn_name: new FormControl(''),
    rate_center: new FormControl(''),
    country: new FormControl(''),
    state: new FormControl(''),
    abbre: new FormControl(''),
    company: new FormControl(''),
    category: new FormControl(''),
    thousand: new FormControl(''),
    clli: new FormControl(''),
    ilec: new FormControl(''),
    switch_name: new FormControl(''),
    switch_type: new FormControl(''),
    rate: new FormControl(''),
    note: new FormControl(''),
    prefix_type: new FormControl(''),
    assign_date: new FormControl('')
  });

  inputNpanxx: string = '';
  inputLata: string = '';
  inputLataName: string = '';
  inputOcn: string = '';
  inputOcn_name: string = '';
  inputRateCenter: string = '';
  inputCountry: string = '';
  inputState: string = '';
  inputAbbre: string = '';
  inputCompany: string = '';
  inputCategory: string = '';
  inputThousand: string = '';
  inputClli: string = '';
  inputIlec: string = '';
  inputSwitchName: string = '';
  inputSwitchType: string = '';
  inputRate: string = '';
  inputNote: string = '';
  inputPrefixType: string = '';
  inputAssignDate: string = '';

  uploadActionOptions: any[] = [
    {name: 'Append', value: 'APPEND'},
    {name: 'Update', value: 'UPDATE'},
    {name: 'Delete', value: 'DELETE'},
  ];
  uploadMethod = 'APPEND';

  demoNPANXX: any[] = [
    {
      npanxx: '207632',
      lata: '120',
      ocn: '4036',
      ocn_name: 'NEW CINGULAR WIRELESS PCS, LLC - DC',
      rc_abbre: 'PORTLAND',
      loc_state: 'ME',
      category: 'WIRELESS',
      rate: '0.00255',
      note: 'ATT ONNET',
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
      if(state.user.permissions?.includes(PERMISSIONS.READ_LERG_MANAGEMENT)) {
      } else {
        // no permission
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
        this.router.navigateByUrl(ROUTES.dashboard.system_overview)
        return
      }
      
    })

    this.getNpanxxList();
    this.getTotalNpanxxCount();
  }

  isNpanxxFormFieldValid(field: string) {
    return !this.npanxxForm.get(field)?.valid && this.npanxxForm.get(field)?.touched;
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
  
  getNpanxxList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue;

      await this.api.getNpanxxList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue)
        .pipe(tap(async (response: any[]) => {
          this.npanxx = [];
          response.map(u => {
            u.created_at = u.created_at ? moment(new Date(u.created_at)).format('YYYY/MM/DD h:mm:ss A') : '';
            u.updated_at = u.updated_at ? moment(new Date(u.updated_at)).format('YYYY/MM/DD h:mm:ss A') : '';
          });

          for (let item of response) {
            item.npa = item.npanxx.slice(0, 3);
            item.nxx = item.npanxx.slice(3, 6);
            this.npanxx.push(item)
          }
        })).toPromise();

      this.filterResultLength = -1;
      await this.api.getNpanxxCount(filterValue)
      .pipe(tap( res => {
        this.filterResultLength = res.count
      })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  getTotalNpanxxCount = async () => {
    this.resultsLength = -1
    await this.api.getNpanxxCount('')
    .pipe(tap( res => {
      this.resultsLength = res.count
    })).toPromise();
  }

  openModal = (modal_title: string) => {
    this.modalTitle = modal_title
    this.flag_openDialog = true
    if(modal_title.toLowerCase()=='edit') {
      this.npanxxForm.controls['npanxx'].disable();
    } else {
      this.npanxxForm.controls['npanxx'].enable();
    }
  }

  closeModal = () => {
    this.flag_openDialog = false;
    this.clearInputs();
  }

  clearInputs = () => {
    this.npanxxForm.reset();
  }

  onSubmit = async () => {
    if (this.npanxxForm.invalid) {
      this.validateAllFormFields(this.npanxxForm)
      return
    }

    let npanxx = this.npanxxForm.get('npanxx')?.value;
    let lata = this.npanxxForm.get('lata')?.value;
    let lata_name = this.npanxxForm.get('lata_name')?.value;
    let ocn = this.npanxxForm.get('ocn')?.value;
    let ocn_name = this.npanxxForm.get('ocn_name')?.value;
    let rate_center = this.npanxxForm.get('rate_center')?.value;
    let country = this.npanxxForm.get('country')?.value;
    let state = this.npanxxForm.get('state')?.value;
    let abbre = this.npanxxForm.get('abbre')?.value;
    let company = this.npanxxForm.get('company')?.value;
    let category = this.npanxxForm.get('category')?.value;
    let thousand = this.npanxxForm.get('thousand')?.value;
    let clli = this.npanxxForm.get('clli')?.value;
    let ilec = this.npanxxForm.get('ilec')?.value;
    let switch_name = this.npanxxForm.get('switch_name')?.value;
    let switch_type = this.npanxxForm.get('switch_type')?.value;
    let rate = Number(this.npanxxForm.get('rate')?.value);
    let note = this.npanxxForm.get('note')?.value;
    let prefix_type = this.npanxxForm.get('prefix_type')?.value;
    let assign_date = this.npanxxForm.get('assign_date')?.value;

    let data = {
      npanxx: npanxx ? npanxx : '',
      lata: lata ? lata : '',
      lata_name: lata_name ? lata_name : '',
      ocn: ocn ? ocn : '',
      ocn_name: ocn_name ? ocn_name : '',
      rate_center: rate_center ? rate_center : '',
      country: country ? country : '',
      state: state ? state : '',
      abbre: abbre ? abbre : '',
      company: company ? company : '',
      category: category ? category : '',
      thousand: thousand ? thousand : '',
      clli: clli ? clli : '',
      ilec: ilec ? ilec : '',
      switch_name: switch_name ? switch_name : '',
      switch_type: switch_type ? switch_type : '',
      rate: Number(rate),
      note: note ? note : '',
      prefix_type: prefix_type ? prefix_type : '',
      assign_date: assign_date ? assign_date : '',
    }

    if(this.modalTitle.toLowerCase()=='add') {
      await this.api.createNPANXX(data).pipe(tap(res=>{
        this.showSuccess('Successfully created!', 'Success');
        this.getNpanxxList();
        this.getTotalNpanxxCount();
      })).toPromise();
    } else if(this.modalTitle.toLowerCase()=='edit') {
      await this.api.updateNPANXX(this.clickedId, data).pipe(tap(res=>{
        this.getNpanxxList();
        this.showSuccess('Successfully updated!', 'Success');
      })).toPromise();
    }

    this.closeModal();
  }

  onOpenEditModal = (event: any, id: string) => {
    this.clickedId = id;
    this.api.getNPANXX(id).subscribe(async res => {
      this.npanxxForm.setValue({
        npanxx: res.npanxx,
        lata: res.lata,
        lata_name: res.lata_name,
        ocn: res.ocn,
        ocn_name: res.ocn_name,
        rate_center: res.rate_center,
        country: res.country,
        state: res.state,
        abbre: res.abbre,
        company: res.company,
        category: res.category,
        thousand: res.thousand,
        clli: res.clli,
        ilec: res.ilec,
        switch_name: res.switch_name,
        switch_type: res.switch_type,
        rate: res.rate,
        note: res.note,
        prefix_type: res.prefix_type,
        assign_date: res.assign_date,
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
        this.api.deleteNPANXXById(id).subscribe(res => {
          this.showSuccess('Successfully deleted!', 'Success');
          this.getNpanxxList();
          this.getTotalNpanxxCount();
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
    await this.getNpanxxList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getNpanxxList();

  onPagination = async (pageIndex: any, pageRows: number) => {
    this.pageSize = pageRows;
    const totalPageCount = Math.ceil(this.filterResultLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    this.pageIndex = pageIndex;
    await this.getNpanxxList();
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
