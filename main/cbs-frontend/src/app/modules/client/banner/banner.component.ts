import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {defaultBanner} from "../default-ui-setting-values";
import {StoreService} from "../../../services/store/store.service";
import {ApiService} from "../../../services/api/api.service";
import { PERMISSIONS } from 'src/app/consts/permissions';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/app.routes';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit {
  @ViewChild('customLogo')
  customLogoRef!: ElementRef;
  logoImg: string = defaultBanner;
  write_permission: boolean = false;
  constructor(
    public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
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
      if(state.user.permissions?.includes(PERMISSIONS.READ_BANNER_MANAGEMENT)) {
      } else {
        // no permission
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, 100) })
        this.router.navigateByUrl(ROUTES.dashboard.system_overview)
        return
      }

      if(state.user.permissions?.indexOf(PERMISSIONS.WRITE_BANNER_MANAGEMENT) == -1)
        this.write_permission = false;
      else
        this.write_permission = true;

      if(state.logoBanner.banner)
        this.logoImg = state.logoBanner.banner;
    })
  }


  /**
   * this is called when the user change the custom logo
   * @param ev logo file input field
   */
   onChangeCustomLogoImg(ev: any) {
    var reader = new FileReader()
    let pThis: any = this

    reader.onload = function () {
      pThis.logoImg = reader.result
    }

    // check the width/height of the image
    var _URL = window.URL || window.webkitURL
    var file = ev.target.files[0]
    var img = new Image();
    var objectUrl = _URL.createObjectURL(file)
    img.onload = function (event) {
      const loadedImage: any = event.currentTarget
      let width = parseFloat(loadedImage.width)
      let height = parseFloat(loadedImage.height)

      _URL.revokeObjectURL(objectUrl)

      reader.readAsDataURL(file)
    }
    img.src = objectUrl

  }

  /**
   * this is called at Logo Remove button on UI Settings tab
   */
  onClickRemoveLogo = () => {
    this.logoImg = ''
    this.customLogoRef.nativeElement.value = ''
  }

  onClickApply = () => {
    this.api.setBanner({value: this.logoImg}).subscribe(res=> {
      this.showSuccess('Successfuly Applied!');
    });
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
