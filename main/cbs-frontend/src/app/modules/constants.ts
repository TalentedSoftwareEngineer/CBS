export enum CBSUserType {
  superAdmin = 'super_admin',
  administrator = 'administrator',
  normalUser = 'normal_user'
}

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export const TIMEZONE = [
  {name: 'Auto Detect', value: ''},
  {name: 'Coordinated Universal Time (UTC)', value: '0'},
  {name: 'Pacific Standard Time (PST)', value: '-8'},
  {name: 'Mountain Standard Time (MST)', value: '-7'},
  {name: 'Central Standard Time (CST)', value: '-6'},
  {name: 'Estern Standard Time (EST)', value: '-5'},
  {name: 'Eastern Daylight Time (EDT)', value: '-4'}
]

export const SUPER_ADMIN_ID = 1
export const SUPER_ADMIN_ROLE_ID = 1

export const NoPermissionAlertInteral = 2000
export const PERMISSION_TYPE_DENY     = "DENY"
export const PERMISSION_TYPE_ALL      = "PERMITALL"
export const PERMISSION_TYPE_READONLY = "READONLY"

export const ALL_FILTER_VALUE = undefined

export const ROWS_PER_PAGE_OPTIONS = [
  {name: '10', value: 10},
  {name: '25', value: 25},
  {name: '50', value: 50}
]

//Contact Information Modal
//Contact name for the TFN that is being reserved.
export const CONTACT_NAME_REG_EXP        = /^[\w\d\s`'!@#$%&*()-_+={}\[\]\:;<>,.?/.]{1,30}$/
//Contact number for the TFN that is being reserved.
export const CONTACT_NUMBER_REG_EXP      = /^[0-9a-zA-Z]{10}$/

//Number Search

export const OCA_NUM_TYPE_RANDOM = "RANDOM"
export const OCA_NUM_TYPE_SPECIFIC = "SPECIFIC"
export const OCA_NUM_TYPE_WILDCARD = "WILDCARD"

export const WILDCARDNUM_REG_EXP  = RegExp('^(8(00|33|44|55|66|77|88|0(&|\\*)|(&|\\*)0|3(&|\\*)|(&|\\*)3|4(&|\\*)|(&|\\*)4|5(&|\\*)|(&|\\*)5|6(&|\\*)|(&|\\*)6|7(&|\\*)|(&|\\*)7|8(&|\\*)|(&|\\*)8|(&|\\*)(&|\\*)))((\\d|&|\\*|[A-Z]|[a-z]){7}|\\-(\\d|&|\\*|[A-Z]|[a-z]){3}\\-(\\d|&|\\*|[A-Z]|[a-z]){4})$')
export const TFNPA_WILDCAD_REG_EXP= RegExp('^(8(00|33|44|55|66|77|88|0(&|\\*)|(&|\\*)0|3(&|\\*)|(&|\\*)3|4(&|\\*)|(&|\\*)4|5(&|\\*)|(&|\\*)5|6(&|\\*)|(&|\\*)6|7(&|\\*)|(&|\\*)7|8(&|\\*)|(&|\\*)8|(&|\\*)(&|\\*)))')
export const SPECIFICNUM_REG_EXP  = RegExp('^(800|833|844|855|866|877|888)((\\d|[A-Z]|[a-z]){7}|\\-(\\d|[A-Z]|[a-z]){3}\\-(\\d|[A-Z]|[a-z]){4})$')
export const SVC_ORDR_NUM_REG_EXP = RegExp('^([a-z]|[A-Z]){1}(\\d|[a-z]|[A-Z]){3,12}(([a-z]|[A-Z]){1})?$')
export const TIME_REG_EXP         = RegExp('^(0?[0-9]|1[0-2]):(00|15|30|45)\\ (a|A|p|P)(m|M)$')
export const RESPORG_REG_EXP      = /[A-Z]{3}[0-9]{2}$/
export const TFNUM_REG_EXP        = RegExp('^(800|833|844|855|866|877|888)(\\d{7}|\\-\\d{3}\\-\\d{4})$')
export const PHONE_NUMBER_WITH_HYPHEN_REG_EXP = RegExp('\\d{10}|\\d{3}\\-\\d{3}\\-\\d{4}$')
export const LIMIT_SIXTY_LETTERS_REG_EXP = /^[\w\d\s`'!@#$%&*()-_+={}\[\]\:;<>,.?/.]{1,60}$/;
export const TEMPLATE_NAME_REG_EXP        = /^[*][a-zA-Z0-9]{2}[a-zA-Z0-9-]{1,12}$/;
export const EMAIL_REG_EXP        = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const INVALID_NUM_TYPE_NONE        = 0
export const INVALID_NUM_TYPE_COMMON      = 1
export const INVALID_NUM_TYPE_NPA         = 2
export const INVALID_NUM_TYPE_AMP         = 3
export const INVALID_NUM_TYPE_CONS        = 4
export const INVALID_NUM_TYPE_WILDCARD    = 5
export const INVALID_NUM_TYPE_TOO_MANY    = 6
export const INVALID_NUM_TYPE_EMPTY       = 7


//Multiple Conversion to Pointer Records
export const TMPL_ERR_TYPE = {
  NONE: 'none',
  BLANK: 'blank',
  ERROR: 'error'
}


export const MAX_REQUESTS_AT_A_TIME_LIMIT = 100

export const NUM_REG_EXP          = RegExp('^(\\d{10}|\\d{3}\\-\\d{3}\\-\\d{4})$')
