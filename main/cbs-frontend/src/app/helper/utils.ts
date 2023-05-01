// @ts-ignore
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { Pipe, PipeTransform } from '@angular/core';

export const getKey = (key: string) => {
  if (key === 'name' || key === 'city' || key === 'state' || key === 'country') {
    return 'Phonebook.' + key

  } else if (key === 'source') {
    return 'trackingSourceName'

  } else if (key === 'op_tracking_number') {
    return 'OpNumber.tracking_number'

  } else if (key === 'number') {
    return 'callerNumber'

  } else if (key === 'routing') {
    return 'SipGateways.address'

  } else if (key === 'receiving_number') {
    return 'ReceivingNumber.number'

  } else if (key === 'tracking_source') {
    return 'TrackingSources.name'

  } else if (key === 'companyId') {
    return 'Customer.companyId'

  } else if (key === 'created') {
    return 'metrics'
  }

  return key
}

export const callLogKeys = [
  'Phonebook.name',
  'Phonebook.city',
  'Phonebook.state',
  'Phonebook.country',
  'OpNumber.TrackingSources.name',
  'OpNumber.SipGateways.address',
  'ReceivingNumber.number',
  'callerNumber',
  'trackingNumber',
  'metrics',
]

export const callLogKeysForSupport = [
  'phonebookName',
  'PhonebookCity',
  'PhonebookState',
  'PhonebookCountry',
  'trackingSourceName',
  'routingAddress',
  'receivingNumber',
  'callerNumber',
  'trackingNumber',
  'metrics',
]

// export const callLogKeysForHadoop = [
//   'callerNumber',
//   'trackingNumber',
//   'trackingSourceName',
//   'routingAddress',
//   'receivingNumber',
//   'metrics',
// ]

export const receivingNumberKeys = [
  'number',
  'description',
  'totalCalls'
]

export const sipGatewayKeys = [
  'name',
  'address',
  'port',
  'digitsStrip',
  'description',
]

export const trackingKeys = [
  'tracking_number',
  'description',
  'TrackingSources.name',
  'Customer.companyId',
  'ReceivingNumber.number',
  'SipGateways.address'
]

export const trackingSourceKeys = [
  'name',
  'description',
  'type'
]

export const userKeys = [
  'username',
  'email',
  'customerId',
  'id'
]

export const TimeToUSTime = {
  '00': '12 AM',
  '01': '1 AM',
  '02': '2 AM',
  '03': '3 AM',
  '04': '4 AM',
  '05': '5 AM',
  '06': '6 AM',
  '07': '7 AM',
  '08': '8 AM',
  '09': '9 AM',
  '10': '10 AM',
  '11': '11 AM',
  '12': '12 PM',
  '13': '1 PM',
  '14': '2 PM',
  '15': '3 PM',
  '16': '4 PM',
  '17': '5 PM',
  '18': '6 PM',
  '19': '7 PM',
  '20': '8 PM',
  '21': '9 PM',
  '22': '10 PM',
  '23': '11 PM',
}

export const USTimeToTime = {
  '12 AM': '00',
  '1 AM': '01',
  '2 AM': '02',
  '3 AM': '03',
  '4 AM': '04',
  '5 AM': '05',
  '6 AM': '06',
  '7 AM': '07',
  '8 AM': '08',
  '9 AM': '09',
  '10 AM': '10',
  '11 AM': '11',
  '12 PM': '12',
  '1 PM': '13',
  '2 PM': '14',
  '3 PM': '15',
  '4 PM': '16',
  '5 PM': '17',
  '6 PM': '18',
  '7 PM': '19',
  '8 PM': '20',
  '9 PM': '21',
  '10 PM': '22',
  '11 PM': '23',
}

export const USMonthToMonth = {
  'Jan': '01',
  'Feb': '02',
  'Mar': '03',
  'Apr': '04',
  'May': '05',
  'Jun': '06',
  'Jul': '07',
  'Aug': '08',
  'Sep': '09',
  'Oct': '10',
  'Nov': '11',
  'Dec': '12',
}

export const MonthToUSMonth = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
}

export const colors = [
  '#57CC5A', '#5bbcd2', '#ffc959', '#E45B5B',
  '#C79E76', '#FF663C', '#BE5CBA', '#ffb3b3',
  '#5B6BC3', '#FF5793', '#007B6B', '#D1005C',
  '#8655C6', '#00ACF8', '#7BC53B', '#FFD700',
  '#FF8600', '#88db44', '#db44a7', '#058DC7',
  '#61767a', '#007348', '#756453', '#903242',
  '#456562', '#987734', '#A64644', '#456542',
  '#643627', '#A87635', '#564523', '#135797',
  '#456787', '#123543', '#123456', '#234514',
  '#F23465', '#F96745', '#FF2945', '#465782',
  '#789543', '#481664', '#784523', '#765465',
  '#798742', '#551375', '#156489', '#798423'
]

export const getDateByUTC = (date: Date) => {
  return date && new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())).toISOString()
}

export const toBase64 = (file: Blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = error => reject(error)
})

export const scrollToTop = () => {
  document.body.scrollTop = document.documentElement.scrollTop = 0
}

export const toUtcDate = (date: Date): Date => {
  let time_difference = Date.UTC(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ) - date.getTime();
  return new Date(date.getTime() - time_difference);
}

export const weeks = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

export const tzs = [
  {name: '(GMT-11:00) American Samoa', value: -11},
  {name: '(GMT-11:00) International Date Line West', value: -11},
  {name: '(GMT-11:00) Midway island', value: -11},
  {name: '(GMT-10:00) Hawaii', value: -10},
  {name: '(GMT-09:00) Alaska', value: -9},
  {name: '(GMT-08:00) America/Los_Angeles', value: -8},
  {name: '(GMT-08:00) Pacific Time (US & Canada)', value: -8},
  {name: '(GMT-08:00) Tijuana', value: -8},
  {name: '(GMT-07:00) America/Denver', value: -7},
  {name: '(GMT-07:00) America/Phoenix', value: -7},
  {name: '(GMT-07:00) Arizona', value: -7},
  {name: '(GMT-07:00) Chihuahua', value: -7},
  {name: '(GMT-07:00) Mazatlan', value: -7},
  {name: '(GMT-07:00) Mountain Time (US & Canada)', value: -7},
  {name: '(GMT-06:00) America/Chicago', value: -6},
  {name: '(GMT-06:00) Central America', value: -6},
  {name: '(GMT-06:00) Central Time (US & Canada)', value: -6},
  {name: '(GMT-06:00) Guadalajara', value: -6},
  {name: '(GMT-06:00) Mexico City', value: -6},
  {name: '(GMT-06:00) Monterrey', value: -6},
  {name: '(GMT-06:00) Saskatchewan', value: -6},
  {name: '(GMT-05:00) America/New_York', value: -5},
  {name: '(GMT-05:00) America/Toronto', value: -5},
  {name: '(GMT-05:00) Bogota', value: -5},
  {name: '(GMT-05:00) Eastern Time (US & Canada)', value: -5},
  {name: '(GMT-05:00) Indiana (East)', value: -5},
  {name: '(GMT-05:00) Lima', value: -5},
  {name: '(GMT-05:00) Quito', value: -5},
  {name: '(GMT-04:00) Atlantic Time (Canada)', value: -4},
  {name: '(GMT-04:00) Caracas', value: -4},
  {name: '(GMT-04:00) Georgetown', value: -4},
  {name: '(GMT-04:00) La Paz', value: -4},
  {name: '(GMT-04:00) Santiago', value: -4},
  {name: '(GMT-03:30) Newfoundland', value: -3.5},
  {name: '(GMT-03:00) America/Sao_Paulo', value: -3},
  {name: '(GMT-03:00) Brasilia', value: -3},
  {name: '(GMT-03:00) Buenos Aires', value: -3},
  {name: '(GMT-03:00) Greenland', value: -3},
  {name: '(GMT-03:00) Montevideo', value: -3},
  {name: '(GMT-02:00) Mid-Atlantic', value: -2},
  {name: '(GMT-01:00) Azores', value: -1},
  {name: '(GMT-01:00) Cape Verde Is.', value: -1},
  {name: '(GMT+00:00) Edinburgh', value: 0},
  {name: '(GMT+00:00) Europe/London', value: 0},
  {name: '(GMT+00:00) Lisbon', value: 0},
  {name: '(GMT+00:00) London', value: 0},
  {name: '(GMT+00:00) Monrovia', value: 0},
  {name: '(GMT+00:00) UTC', value: 0},
  {name: '(GMT+01:00) Amsterdam', value: 1},
  {name: '(GMT+01:00) Belgrade', value: 1},
  {name: '(GMT+01:00) Berlin', value: 1},
  {name: '(GMT+01:00) Bern', value: 1},
  {name: '(GMT+01:00) Bratislava', value: 1},
  {name: '(GMT+01:00) Brussels', value: 1},
  {name: '(GMT+01:00) Budapest', value: 1},
  {name: '(GMT+01:00) Casablanca', value: 1},
  {name: '(GMT+01:00) Copenhagen', value: 1},
  {name: '(GMT+01:00) Dublin', value: 1},
  {name: '(GMT+01:00) Ljubljana', value: 1},
  {name: '(GMT+01:00) Madrid', value: 1},
  {name: '(GMT+01:00) Paris', value: 1},
  {name: '(GMT+01:00) Prague', value: 1},
  {name: '(GMT+01:00) Rome', value: 1},
  {name: '(GMT+01:00) Sarajevo', value: 1},
  {name: '(GMT+01:00) Skopje', value: 1},
  {name: '(GMT+01:00) Stockholm', value: 1},
  {name: '(GMT+01:00) Vienna', value: 1},
  {name: '(GMT+01:00) Warsaw', value: 1},
  {name: '(GMT+01:00) West Central Africa', value: 1},
  {name: '(GMT+01:00) Zagreb', value: 1},
  {name: '(GMT+02:00) Athens', value: 2},
  {name: '(GMT+02:00) Bucharest', value: 2},
  {name: '(GMT+02:00) Cairo', value: 2},
  {name: '(GMT+02:00) Europe/Bucharest', value: 2},
  {name: '(GMT+02:00) Europe/Helsinki', value: 2},
  {name: '(GMT+02:00) Harare', value: 2},
  {name: '(GMT+02:00) Helsinki', value: 2},
  {name: '(GMT+02:00) Jerusalem', value: 2},
  {name: '(GMT+02:00) Kaliningrad', value: 2},
  {name: '(GMT+02:00) Kyiv', value: 2},
  {name: '(GMT+02:00) Pretoria', value: 2},
  {name: '(GMT+02:00) Riga', value: 2},
  {name: '(GMT+02:00) Sofia', value: 2},
  {name: '(GMT+02:00) Tallinn', value: 2},
  {name: '(GMT+02:00) Vilnius', value: 2},
  {name: '(GMT+03:00) Baghdad', value: 3},
  {name: '(GMT+03:00) Istanbul', value: 3},
  {name: '(GMT+03:00) Kuwait', value: 3},
  {name: '(GMT+03:00) Minsk', value: 3},
  {name: '(GMT+03:00) Moscow', value: 3},
  {name: '(GMT+03:00) Nairobi', value: 3},
  {name: '(GMT+03:00) Riyadh', value: 3},
  {name: '(GMT+03:00) St. Petersburg', value: 3},
  {name: '(GMT+03:30) Tehran', value: 3.5},
  {name: '(GMT+04:00) Abu Dhabi', value: 4},
  {name: '(GMT+04:00) Baku', value: 4},
  {name: '(GMT+04:00) Muscat', value: 4},
  {name: '(GMT+04:00) Samara', value: 4},
  {name: '(GMT+04:00) Tbilisi', value: 4},
  {name: '(GMT+04:00) Volgograd', value: 4},
  {name: '(GMT+04:00) Yerevan', value: 4},
  {name: '(GMT+04:30) Kabul', value: 4.5},
  {name: '(GMT+05:00) Ekaterinburg', value: 5},
  {name: '(GMT+05:00) Islamabad', value: 5},
  {name: '(GMT+05:00) Karachi', value: 5},
  {name: '(GMT+05:00) Tashkent', value: 5},
  {name: '(GMT+05:30) Chennai', value: 5.5},
  {name: '(GMT+05:30) Kolkata', value: 5.5},
  {name: '(GMT+05:30) Mumbai', value: 5.5},
  {name: '(GMT+05:30) New Delhi', value: 5.5},
  {name: '(GMT+05:30) Sri Jayawardenepura', value: 5.5},
  {name: '(GMT+05:45) Kathmandu', value: 5.75},
  {name: '(GMT+06:00) Almaty', value: 6},
  {name: '(GMT+06:00) Astana', value: 6},
  {name: '(GMT+06:00) Dhaka', value: 6},
  {name: '(GMT+06:00) Urumqi', value: 6},
  {name: '(GMT+06:30) Rangoon', value: 6.5},
  {name: '(GMT+07:00) Bangkok', value: 7},
  {name: '(GMT+07:00) Hanoi', value: 7},
  {name: '(GMT+07:00) Jakarta', value: 7},
  {name: '(GMT+07:00) Krasnoyarsk', value: 7},
  {name: '(GMT+07:00) Novosibirsk', value: 7},
  {name: '(GMT+08:00) Beijing', value: 8},
  {name: '(GMT+08:00) Chongqing', value: 8},
  {name: '(GMT+08:00) Hong Kong', value: 8},
  {name: '(GMT+08:00) Irkutsk', value: 8},
  {name: '(GMT+08:00) Kuala Lumpur', value: 8},
  {name: '(GMT+08:00) Perth', value: 8},
  {name: '(GMT+08:00) Singapore', value: 8},
  {name: '(GMT+08:00) Taipei', value: 8},
  {name: '(GMT+08:00) Ulaanbaatar', value: 8},
  {name: '(GMT+09:00) Osaka', value: 9},
  {name: '(GMT+09:00) Sapporo', value: 9},
  {name: '(GMT+09:00) Seoul', value: 9},
  {name: '(GMT+09:00) Tokyo', value: 9},
  {name: '(GMT+09:00) Yakutsk', value: 9},
  {name: '(GMT+09:30) Adelaide', value: 9.5},
  {name: '(GMT+09:30) Darwin', value: 9.5},
  {name: '(GMT+10:00) Brisbane', value: 10},
  {name: '(GMT+10:00) Canberra', value: 10},
  {name: '(GMT+10:00) Guam', value: 10},
  {name: '(GMT+10:00) Hobart', value: 10},
  {name: '(GMT+10:00) Melbourne', value: 10},
  {name: '(GMT+10:00) Port Moresby', value: 10},
  {name: '(GMT+10:00) Sydney', value: 10},
  {name: '(GMT+10:00) Vladivostok', value: 10},
  {name: '(GMT+11:00) Magadan', value: 11},
  {name: '(GMT+11:00) New Caledonia', value: 11},
  {name: '(GMT+11:00) Solomon Is.', value: 11},
  {name: '(GMT+11:00) Srednekolymsk', value: 11},
  {name: '(GMT+12:00) Auckland', value: 12},
  {name: '(GMT+12:00) Fiji', value: 12},
  {name: '(GMT+12:00) Kamchatka', value: 12},
  {name: '(GMT+12:00) Marshall Is.', value: 12},
  {name: '(GMT+12:00) Wellington', value: 12},
  {name: '(GMT+12:45) Chatham Is.', value: 12.75},
  {name: '(GMT+13:00) Nuku\'alofa', value: 13},
  {name: '(GMT+13:00) Samoa', value: 13},
  {name: '(GMT+13:00) Tokelau Is.', value: 13},
]

export const DaysOfMonth = {
  '01': 31,
  '02': 38,
  '03': 31,
  '04': 30,
  '05': 31,
  '06': 30,
  '07': 31,
  '08': 31,
  '09': 30,
  '10': 31,
  '11': 30,
  '12': 31,
  1: 31,
  2: 38,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
}

export const closePanels = () => {

  // close filter panel
  if (document.getElementsByClassName('filter_div')[0] != undefined)
    document.getElementsByClassName('filter_div')[0].classList.remove("open")

  // close menu
  if (document.getElementsByTagName('body')[0] && !document.getElementsByTagName('body')[0].classList.contains('offcanvas-active'))
    document.getElementsByTagName('body')[0].classList.add('offcanvas-active')

  // @ts-ignore
  if (document.getElementById('page-header-left-part') && !document.getElementById('page-header-left-part').classList.contains('offcanvas-active'))
    { // @ts-ignore
      document.getElementById('page-header-left-part').classList.add('offcanvas-active')
    }

  // @ts-ignore
  if (document.getElementById('page-header-right-part') && !document.getElementById('page-header-right-part').classList.contains('offcanvas-active'))
    { // @ts-ignore
      document.getElementById('page-header-right-part').classList.add('offcanvas-active')
    }

  // close overlay
  document.getElementsByClassName('overlay')[0].classList.remove("open")
}
