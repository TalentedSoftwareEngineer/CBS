import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {ApiService} from "../../../services/api/api.service";
import {StoreService} from "../../../services/store/store.service";
import { tap } from "rxjs/operators";
import moment from 'moment';
import { PERMISSIONS } from 'src/app/consts/permissions';
import { ROUTES } from 'src/app/app.routes';
import { Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { PAGE_SIZE_OPTIONS } from '../../constants';
import { defaultBanner } from '../default-ui-setting-values';

import {jsPDF} from 'jspdf';

@Component({
  selector: 'app-create-billing-statement',
  templateUrl: './create-billing-statement.component.html',
  styleUrls: ['./create-billing-statement.component.scss']
})
export class CreateBillingStatementComponent implements OnInit {

  serverOptions: any[] = [];
  selectServer: string = '';

  customerOptions: any[] = [];
  selectCustomer: string = '';

  selectedDate: any = [new Date(), null];
  @ViewChild('calendar') calendar!: Calendar;

  isLoading = true
  isProcessing = false
  totalStatistics: any = { stats: {}, total_calls: '', total_minutes: '', avg_minutes: '', total_cost: '', avg_cost: ''}
  cdrDetails: any[] = []

  rowsPerPageOptions: any[] = PAGE_SIZE_OPTIONS;

  dailyTrafficSummaries: any[] = [];

  numberTrafficSummaries: any[] = [];

  bannerImg: string = defaultBanner;

  flag_generateDialog = false
  @ViewChild('statementContent') statementContent!: ElementRef

  canGenerate = false
  stmtNo = ""

  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    public router: Router,
    private renderer: Renderer2,
    private confirmationService: ConfirmationService,
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

    if(this.store.getUser().permissions?.includes(PERMISSIONS.CREATE_BILLING_STATEMENT)) {
    } else {
      // no permission
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
      this.router.navigateByUrl(ROUTES.dashboard.system_overview)
      return
    }

    this.api.getLogoBannerConfigurations().subscribe(res => {
      this.store.storeLogoBanner(res);
      if(res.banner)
        this.bannerImg = res.banner;
    });

    await this.getCdrServer();
    await this.getCustomerList();
  }

  getCdrServer = async () => {
    this.serverOptions = [];
    await this.api.getCdrServerForFilter()
      .pipe(tap(async (response: any[]) => {
        this.serverOptions = [{name: 'All', value: ''}, ...response.map(item=>({name: item.name, value: item.id}))];
        this.selectServer = this.serverOptions[0].value;
      })).toPromise();
  }

  getCustomerList = async () => {
    try {
      await this.api.getCustomerListForFilter()
        .pipe(tap(async (res: any[]) => {
          res.map(u => {
            u.full_companyTitle = u.company_name + ' (' + u.company_id + ')';
          });

          this.customerOptions = res.map(item=>({name: item.full_companyTitle, value: item.id}));
          this.selectCustomer = this.customerOptions[0].value;
        })).toPromise();
    } catch (e) {
    }

    this.isLoading = false
  }

  onView = async () => {
    let offset = new Date().getTimezoneOffset()
    if(Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset*1000)/1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset*1000)/1000;

    this.isLoading = true
    await this.api.calculateRateDeck(
      this.selectCustomer,
      this.selectServer,
      utcStart,
      utcEnd,
    ).pipe(tap(async (response: any) => {
      // console.log(response)
      this.isProcessing = true

      await this.showStatistics(response.stats)
      await this.buildStatement(response.logs)

      this.isProcessing = false
      this.isLoading = false
    })).toPromise().catch(err => {
      this.isProcessing = false
      this.isLoading = false
    });
  }

  showStatistics = async (stats: any) => {
    this.totalStatistics.stats = stats
    this.totalStatistics.total_calls = stats.calls

    let exact = stats.duration / 60;
    let sec = Math.round((exact - Math.floor(exact)) * 60);
    this.totalStatistics.total_minutes =  Math.floor(exact) + ':' + (sec < 10 ? `0${sec}` : sec);

    exact = stats.calls ==0 ? 0 : stats.duration / 60 / stats.calls;
    sec = Math.round((exact - Math.floor(exact)) * 60);
    this.totalStatistics.avg_minutes =  Math.floor(exact) + ':' + (sec < 10 ? `0${sec}` : sec);

    this.totalStatistics.total_cost = stats.cost
    this.totalStatistics.avg_cost = stats.calls==0 ? '0' : (stats.cost / stats.calls).toFixed(3)
  }

  buildStatement = async (logs: any[]) => {
    let offset = new Date().getTimezoneOffset()
    if(Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let cdrDetails: any[] = []
    let dailyTrafficSummaries: any[] = []
    let numberTrafficSummaries: any[] = []

    for (let log of logs) {
      const date = moment.utc(Number(log.StartTime) * 1000).utcOffset(-offset).format('MM/DD/YYYY')
      let index = dailyTrafficSummaries.findIndex(item => item.date==date)
      if (index==-1) {
        dailyTrafficSummaries.push({
          date: date,
          calls: 1,
          duration: log.Duration,
          cost: log.cost,
          avg_dur: log.Duration,
          avg_cost: log.cost
        })
      } else {
        dailyTrafficSummaries[index].calls++
        dailyTrafficSummaries[index].duration += log.Duration
        dailyTrafficSummaries[index].cost = Number((dailyTrafficSummaries[index].cost+log.cost).toFixed(3))
        dailyTrafficSummaries[index].avg_dur = Math.round(dailyTrafficSummaries[index].duration / dailyTrafficSummaries[index].calls)
        dailyTrafficSummaries[index].avg_cost = Number((dailyTrafficSummaries[index].cost / dailyTrafficSummaries[index].calls).toFixed(3))
      }

      let n = log.Called.trim()
      if (n.length==12 && n.substring(0,1)=="+")
        n = n.substring(2)
      else if (n.length==11 && n.substring(0,1)=="1")
        n = n.substring(1)
      else if (n.length>=10)
        n = n.substring(n.length-10)
      else {
        n = ""
      }

      if (n!="") {
        index = numberTrafficSummaries.findIndex(item => item.num==n)
        if (index==-1) {
          numberTrafficSummaries.push({
            num: n,
            calls: 1,
            duration: log.Duration,
            cost: log.cost,
            avg_dur: log.Duration,
            avg_cost: log.cost
          })
        } else {
          numberTrafficSummaries[index].calls++
          numberTrafficSummaries[index].duration+=log.Duration
          numberTrafficSummaries[index].cost = Number((numberTrafficSummaries[index].cost + log.cost).toFixed(3))
          numberTrafficSummaries[index].avg_dur = Math.round(numberTrafficSummaries[index].duration / numberTrafficSummaries[index].calls)
          numberTrafficSummaries[index].avg_cost = Number((numberTrafficSummaries[index].cost / numberTrafficSummaries[index].calls).toFixed(3))
        }
      }  
      
      cdrDetails.push({
        ...log,
        StartTime: moment.utc(Number(log.StartTime) * 1000).utcOffset(-offset).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A'),
        EndTime: log.EndTime ? moment.utc(Number(log.EndTime) * 1000).utcOffset(-offset).format(this.store.getUser()?.time_format ? this.store.getUser()?.time_format : 'MM/DD/YYYY h:mm:ss A') : '',
        Calling: log.Calling, Called: log.Called, cost: log.cost,
        Duration: (Math.floor(log.Duration / 60) + ':' + ((log.Duration % 60) > 9 ? (log.Duration % 60) : '0'+(log.Duration % 60)))
      })
    }

    this.dailyTrafficSummaries = dailyTrafficSummaries.map(item => {
      let u = {...item}
      u.minutes = (Math.floor(u.duration / 60) + ':' + ((u.duration % 60) > 9 ? (u.duration % 60) : '0'+(u.duration % 60)))
      u.avg_mins = (Math.floor(u.avg_dur / 60) + ':' + ((u.avg_dur % 60) > 9 ? (u.avg_dur % 60) : '0'+(u.avg_dur % 60)))
      return u
    })

    this.dailyTrafficSummaries.sort((a,b) => a.date<b.date ? -1 : 1)

    this.numberTrafficSummaries = numberTrafficSummaries.map(item => {
      let u = {...item}
      u.minutes = (Math.floor(u.duration / 60) + ':' + ((u.duration % 60) > 9 ? (u.duration % 60) : '0'+(u.duration % 60)))
      u.avg_mins = (Math.floor(u.avg_dur / 60) + ':' + ((u.avg_dur % 60) > 9 ? (u.avg_dur % 60) : '0'+(u.avg_dur % 60)))
      return u
    })

    this.cdrDetails = [...cdrDetails]
    this.canGenerate = cdrDetails.length>0
  }

  onGenerate = async () => {
    let offset = new Date().getTimezoneOffset()
    if (Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset * 1000) / 1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset * 1000) / 1000;

    this.isLoading = true
    await this.api.checkStatement(
      this.selectCustomer,
      this.selectServer,
      utcStart,
      utcEnd,
    ).pipe(tap(async (response: any) => {
      this.isLoading = false
      if (response.stmt_no) {
      } else {
        this.showError("Failed to get Statement No")
        return;
      }

      this.stmtNo = response.stmt_no
      if (response.existed) {
        this.confirmationService.confirm({
          message: 'This customer have same statement. Do you want to generate again?',
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            this.generatePreview()
          },
          reject: (type: any) => {
          }
        });

      } else
        this.generatePreview()

    })).toPromise().catch(err => {
      this.isLoading = false
    });


  }

  generatePreview = async() => {
    this.isProcessing = true
    this.isLoading = true

    let dailyTrafficSummariesTableBody = '';
    let dailyTrafficSummariesTableFooter = '';
    let numberTrafficSummariesTableBody = '';
    let numberTrafficSummariesTableFooter = '';
    let cdrDetailsTableBody = '';
    let cdrDetailsTableFooter = '';
    const lines = 28

    let index = 9
    if (index % lines != lines - 1) {
      dailyTrafficSummariesTableBody += `
          <tr style="background-color: #dddddd;">
            <th style="border: 1px solid #000000;padding: 8px;">Date</th>
            <th style="border: 1px solid #000000;padding: 8px;">Calls</th>
            <th style="border: 1px solid #000000;padding: 8px;">Minutes</th>
            <th style="border: 1px solid #000000;padding: 8px;">Cost</th>
            <th style="border: 1px solid #000000;padding: 8px;">Avg Dur</th>
            <th style="border: 1px solid #000000;padding: 8px;">Avg Cost</th>
          </tr>
        `;
      index++
    }

    this.dailyTrafficSummaries.forEach((item) => {
      if (index % lines) {
        dailyTrafficSummariesTableBody += `
          <tr>
            <td style="border: 1px solid #000000;padding: 8px;">${item.date}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.calls}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.minutes}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.cost}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.avg_dur}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.avg_cost}</td>
          </tr>
        `;
      } else {
        dailyTrafficSummariesTableBody += `
          <tr style="background-color: #dddddd;">
            <th style="border: 1px solid #000000;padding: 10px 6px;">Date</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Calls</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Minutes</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Cost</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Avg Dur</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Avg Cost</th>
          </tr>
          <tr>
            <td style="border: 1px solid #000000;padding: 8px;">${item.date}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.calls}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.minutes}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.cost}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.avg_dur}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.avg_cost}</td>
          </tr>
        `;
        index++
      }

      index++
    });

    dailyTrafficSummariesTableFooter = this.dailyTrafficSummaries.length ? `
      <tr style="background-color: #dddddd;">
        <th style="border: 1px solid #000000;padding: 8px;">Total</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.total_calls}</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.total_minutes}</th>
        <th style="border: 1px solid #000000;padding: 8px;">$${this.totalStatistics?.total_cost}</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.avg_minutes}</th>
        <th style="border: 1px solid #000000;padding: 8px;">$${this.totalStatistics.avg_cost}</th>
      </tr>
    ` : '';

    if (this.dailyTrafficSummaries.length > 0)
      index++
    index += 2

    if (index % lines != lines - 1) {
      numberTrafficSummariesTableBody += `
          <tr style="background-color: #dddddd;">
            <th style="border: 1px solid #000000;padding: 8px;">Tollfree Number</th>
            <th style="border: 1px solid #000000;padding: 8px;">Calls</th>
            <th style="border: 1px solid #000000;padding: 8px;">Minutes</th>
            <th style="border: 1px solid #000000;padding: 8px;">Cost</th>
            <th style="border: 1px solid #000000;padding: 8px;">Avg Dur</th>
            <th style="border: 1px solid #000000;padding: 8px;">Avg Cost</th>
          </tr>
        `;
      index++
    }

    this.numberTrafficSummaries.forEach((item) => {
      if (index % lines) {
        numberTrafficSummariesTableBody += `
          <tr>
            <td style="border: 1px solid #000000;padding: 8px;">${item.num}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.calls}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.minutes}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.cost}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.avg_dur}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.avg_cost}</td>
          </tr>
        `;
      } else {
        numberTrafficSummariesTableBody += `
          <tr style="background-color: #dddddd;">
            <th style="border: 1px solid #000000;padding: 10px 6px;">Tollfree Number</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Calls</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Minutes</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Cost</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Avg Dur</th>
            <th style="border: 1px solid #000000;padding: 10px 6px;">Avg Cost</th>
          </tr>
          <tr>
            <td style="border: 1px solid #000000;padding: 8px;">${item.num}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.calls}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.minutes}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.cost}</td>
            <td style="border: 1px solid #000000;padding: 8px;">${item.avg_dur}</td>
            <td style="border: 1px solid #000000;padding: 8px;">$${item.avg_cost}</td>
          </tr>
        `;
        index++
      }

      index++
    });

    numberTrafficSummariesTableFooter = this.numberTrafficSummaries.length ? `
      <tr style="background-color: #dddddd;">
        <th style="border: 1px solid #000000;padding: 8px;">Total</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.total_calls}</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.total_minutes}</th>
        <th style="border: 1px solid #000000;padding: 8px;">$${this.totalStatistics?.total_cost}</th>
        <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.avg_minutes}</th>
        <th style="border: 1px solid #000000;padding: 8px;">$${this.totalStatistics.avg_cost}</th>
      </tr>
    ` : '';

    if (this.numberTrafficSummaries.length > 0)
      index++
    index += 2
    /*
        if (index%lines!=lines-1) {
          cdrDetailsTableBody += `
              <tr style="background-color: #dddddd;">
                <th style="border: 1px solid #000000;padding: 8px 3px;">Start Time</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">End Time</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Calling</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Called</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Duration</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Cost</th>
              </tr>
            `;
          index++
        }

        this.cdrDetails.forEach((item)=>{
          if(index % lines) {
            cdrDetailsTableBody += `
              <tr>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.StartTime}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.EndTime}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Calling}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Called}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Duration}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">$${item.cost}</td>
              </tr>
            `;
          } else {
            cdrDetailsTableBody += `
              <tr style="background-color: #dddddd;">
                <th style="border: 1px solid #000000;padding: 8px 3px;">Start Time</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">End Time</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Calling</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Called</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Duration</th>
                <th style="border: 1px solid #000000;padding: 8px 3px;">Cost</th>
              </tr>
              <tr>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.StartTime}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.EndTime}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Calling}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Called}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">${item.Duration}</td>
                <td style="border: 1px solid #000000;padding: 8px 3px;">$${item.cost}</td>
              </tr>
            `;
            index++
          }

          index++
        });

        cdrDetailsTableFooter = this.cdrDetails.length ? `
          <tr style="background-color: #dddddd;">
            <th style="border: 1px solid #000000;padding: 8px;">Total</th>
            <th style="border: 1px solid #000000;padding: 8px;"></th>
            <th style="border: 1px solid #000000;padding: 8px;"></th>
            <th style="border: 1px solid #000000;padding: 8px;"></th>
            <th style="border: 1px solid #000000;padding: 8px;">${this.totalStatistics.total_minutes}</th>
            <th style="border: 1px solid #000000;padding: 8px;">$${this.totalStatistics?.total_cost}</th>
          </tr>
        ` : '';
    */

    let html = `
      <div style="padding-top: 8px;">
        <div>
          <img src="${this.bannerImg}" alt="CBS logo" style="height:60px;float: left;">
          <h1 style="text-align: center; color: #000;">Billing Statement</h1>
        </div>

        <h3 style="text-align: center;color: #000;">${this.customerOptions.find(item => item.value == this.selectCustomer)?.name}</h3>

        <div style="width: 100%;display: flex; justify-content: space-between;">
          <h5 style="color: #000;margin-top: 1.25rem;">No.: ${this.stmtNo}</h5>
          <h5 style="color: #000;">${moment(this.selectedDate[0]).format('MM/DD/YYYY')}${this.selectedDate[1] ? '-' + moment(this.selectedDate[1]).format('MM/DD/YYYY') : ''}</h5>
        </div>

        <hr>

        <div style="margin-top: 1.25rem;">
          <h4>Traffic Summary by Day</h4>
          <table style="width: 100%;border-collapse: collapse;font-size: 11px;text-align: left;">
            ${dailyTrafficSummariesTableBody}
            ${dailyTrafficSummariesTableFooter}
          </table>
        </div>

        <div style="margin-top: 1.25rem;">
          <h4>Traffic summary by Toll Free Number</h4>
          <table style="width: 100%;border-collapse: collapse;font-size: 11px;text-align: left;">
            ${numberTrafficSummariesTableBody}
            ${numberTrafficSummariesTableFooter}
          </table>
        </div>
      </div>
    `

    //   <div style="margin-top: 1.65rem;">
    //   <h4>Call Detail</h4>
    // <table style="width: 100%;border-collapse: collapse;font-size: 11px;text-align: left;">
    //   ${cdrDetailsTableBody}
    //   ${cdrDetailsTableFooter}
    //   </table>
    //   </div>

    this.renderer.setProperty(this.statementContent.nativeElement, 'innerHTML', html);
    this.isProcessing = false
    this.flag_generateDialog = true

    this.isLoading = false
  }

  generateStatement = async () => {
    let offset = new Date().getTimezoneOffset()
    if (Boolean(this.store.getUser()?.timezone)) {
      offset = Number(this.store.getUser()?.timezone) * -60
    }

    let localStart = new Date(moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00:00.000Z');
    let utcStart = (localStart.getTime() + offset * 1000) / 1000;

    let localEnd = new Date(moment(this.selectedDate[1] ? this.selectedDate[1] : this.selectedDate[0]).format('YYYY-MM-DD') + ' 23:59:59.000Z');
    let utcEnd = (localEnd.getTime() + offset * 1000) / 1000;

    this.isLoading = true
    await this.api.generateStatement(
      this.stmtNo,
      this.selectCustomer,
      this.selectServer,
      utcStart,
      utcEnd,
      this.totalStatistics.stats.calls,
      this.totalStatistics.stats.duration,
      this.totalStatistics.stats.cost,
      this.statementContent.nativeElement.innerHTML,
    ).pipe(tap(async (response: any) => {
      if (response.success) {
        this.isLoading = false
        this.isProcessing = true
        const doc = new jsPDF({
          unit: 'px',
          compress: true,
          format: [595, 842] // A4
          // format: [695, 842]
        });

        doc.html(this.statementContent.nativeElement, {
          callback: (doc: jsPDF) => {
            doc.save('Statement.pdf');

            this.isProcessing = false
            this.flag_generateDialog = false
          }
        });
      } else {
        this.showWarn("Failed to generate statement.")
      }
    })).toPromise().catch(err => {
      this.isProcessing = false
      this.isLoading = false
    });
  }

  onSelectDateRangePicker = (event: any) => {
    if(this.selectedDate[0] != null && this.selectedDate[1] != null) {
      if(moment(this.selectedDate[0]).format('YYYY-MM-DD') == moment(this.selectedDate[1]).format('YYYY-MM-DD'))
        this.selectedDate = [this.selectedDate[0], null];

      this.calendar.hideOverlay()
    }
  }

  onClickToday = () => {
    this.selectedDate = [new Date(), null];
    this.calendar.hideOverlay()
  }

  onClickYesterday = () => {
    this.selectedDate = [moment().subtract(1, "days").toDate(), null];
    this.calendar.hideOverlay()
  }

  onClickLastWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay())));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()) + 6));
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickLastMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay();
  }

  onClickThisMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onClickThisWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay())));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()) + 6));
    this.selectedDate = [startDate, endDate];
    this.calendar.hideOverlay()
  }

  onDailyTrafficSummariesDownload = () => {
    let content = '';

    this.dailyTrafficSummaries.forEach((item, index) => {
      content += `\n${item.date}, ${item.calls}, ${item.minutes==null?'':item.minutes}, ${item.cost==null?'':item.cost}, ${item.avg_mins==null?'':item.avg_mins}, ${item.avg_cost==null?'':item.avg_cost}`;
    });

    let data = `Date,Calls,Duration,Cost,Avg Dur,Avg Cost${content}\nTotal,${this.totalStatistics.total_calls},${this.totalStatistics.total_minutes},${this.totalStatistics?.total_cost ? this.totalStatistics?.total_cost : ''}, ,${this.totalStatistics?.avg_cost ? this.totalStatistics?.avg_cost : ''}`
    const csvContent = 'data:text/csv;charset=utf-8,' + data;
    const url = encodeURI(csvContent);
    let fileName = 'Traffic_Summary_By_Day'+moment(new Date()).format('YYYY_MM_DD_hh_mm_ss');

    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.setAttribute('download', fileName);
    tempLink.click();
  }

  onNumberTrafficSummariesDownload = () => {
    let content = '';

    this.numberTrafficSummaries.forEach((item, index) => {
      content += `\n${item.num}, ${item.calls}, ${item.minutes==null?'':item.minutes}, ${item.cost==null?'':item.cost}, ${item.avg_mins==null?'':item.avg_mins}, ${item.avg_cost==null?'':item.avg_cost}`;
    });

    let data = `Tollfree Number,Calls,Duration,Cost,Avg Dur,Avg Cost${content}\nTotal,${this.totalStatistics.total_calls},${this.totalStatistics.total_minutes},${this.totalStatistics?.total_cost ? this.totalStatistics?.total_cost : ''}, ,${this.totalStatistics?.avg_cost ? this.totalStatistics?.avg_cost : ''}`
    const csvContent = 'data:text/csv;charset=utf-8,' + data;
    const url = encodeURI(csvContent);
    let fileName = 'Traffic_Summary_By_TollFree_Number'+moment(new Date()).format('YYYY_MM_DD_hh_mm_ss');

    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.setAttribute('download', fileName);
    tempLink.click();
  }

  onCdrDetailsDownload = () => {
    let content = '';

    this.cdrDetails.forEach((item, index) => {
      content += `\n${item.StartTime},${item.EndTime},${item.Calling==null?'':item.Calling},${item.Called==null?'':item.Called},${item.Duration==null?'':item.Duration},${item.inter_rate}/${item.intra_rate},${item.init_duration}/${item.succ_duration},${item.cost}`;
    });

    let data = `Start Time,End Time,Calling,Called,Duration,Inter/Intra Rate,Init/Succ Duration,Cost,${content}\nTotal,,,,,,,${this.totalStatistics?.total_cost ? this.totalStatistics?.total_cost : ''}`
    const csvContent = 'data:text/csv;charset=utf-8,' + data;
    const url = encodeURI(csvContent);
    let fileName = 'Cdr_Details' + moment(new Date()).format('YYYY_MM_DD_hh_mm_ss');

    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.setAttribute('download', fileName);
    tempLink.click();
  }

  closeGenerateDialog() {
    this.flag_generateDialog = false
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
