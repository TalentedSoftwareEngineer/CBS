import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';

import { LeftmenuComponent } from './leftmenu/leftmenu.component';
import { SharedModule} from './shared/shared.module';

import {MenuModule} from "primeng/menu";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {SplitButtonModule} from "primeng/splitbutton";
import {ToggleButtonModule} from "primeng/togglebutton";
import {PanelMenuModule} from "primeng/panelmenu";
import {TableModule} from "primeng/table";
import {ChartModule} from "primeng/chart";
import {SelectButtonModule} from "primeng/selectbutton";
import {AutoCompleteModule} from "primeng/autocomplete";
import {InputTextModule} from "primeng/inputtext";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ProgressSpinnerModule} from "primeng/progressspinner";
// @ts-ignore
import {CountToModule} from "angular-count-to";
import {FooterComponent} from "./footer/footer.component";
import {LayoutComponent} from "./layout/layout.component";
import {AppMenuitemComponent} from "./leftmenu/menuitem.component";

// FullCalendarModule.registerPlugins([ // register FullCalendar plugins
//   dayGridPlugin,
//   timeGridPlugin,
//   interactionPlugin
// ]);

// const maskConfig: Partial<IConfig> = {
//   validation: false
// };

@NgModule({
  imports: [
    CommonModule,
    ClientRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,

    // primeng component modules
    MenuModule,
    // ---------------------------------

    CountToModule,
  ],
  declarations: [
    HeaderComponent,
    LeftmenuComponent,
    AppMenuitemComponent,
    FooterComponent,
    LayoutComponent,
  ],
  providers: [],
  exports: [
    LeftmenuComponent,
    HeaderComponent,
    FooterComponent
  ]
})
export class ClientModule { }
