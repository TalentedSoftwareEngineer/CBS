import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-client-activities',
  templateUrl: './client-activities.component.html',
  styleUrls: ['./client-activities.component.scss']
})
export class ClientActivitiesComponent implements OnInit {

  activities: any[] = [];
  constructor() { }

  ngOnInit(): void {
    this.activities = [
      {title: 'Crissy Wilson (Association Management Services)', ip: '67.160.214.251', period: '1 month ago'},
      {title: 'Crissy Wilson (Arizona Professional Land Surveyors (APLS))', ip: '67.160.214.251', period: '1 month ago'},
      {title: 'Jacqueline T Riggio (JRS Construction)', ip: '67.160.214.251', period: '1 month ago'},
      {title: 'Jodie  McEwen (HillCrest Insurance Agency)', ip: '67.160.214.251', period: '1 month ago'}, 
    ]
  }

}
