import { Component, OnInit, ViewChild } from '@angular/core';
import {MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auto-generate-statement',
  templateUrl: './auto-generate-statement.component.html',
  styleUrls: ['./auto-generate-statement.component.scss']
})
export class AutoGenerateStatementComponent implements OnInit {

  leftCustomers: any[] = [];
  rightCustomers: any[] = [];

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.AUTO_GENERATE_STATEMENT)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    await this.getCustomerList();
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          res.map(u => {
            u.full_name = u.first_name + ' ' + u.last_name;
            u.full_companyTitle = u.company_name + ' (' + u.company_id + ')';
          });

          this.leftCustomers = res.filter(item=>!item?.auto_statement);
          this.rightCustomers = res.filter(item=>item?.auto_statement);
        })).toPromise();
    } catch (e) {
    }
  }

  onSave = () => {
    let data: any[] = [];
    data = [
      ...this.leftCustomers.map(item=>({customer_id: item.id, auto_statement: false})),
      ...this.rightCustomers.map(item=>({customer_id: item.id, auto_statement: true})),
    ];
    this.api.billingAutoStatement(data).subscribe(res=>{
      this.getCustomerList();
      this.showSuccess('Successfully Saved!', 'Success');
    });
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
