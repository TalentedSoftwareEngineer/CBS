export const SERVER = process.env.NODE_ENV=='production' ? 'billing2.dipvtel.com' : (process.env.NODE_ENV=='development' ? 'billing-dev.dipvtel.com' : 'localhost')
export const PUBLIC_KEY = process.env.NODE_ENV=='production' ? '/etc/letsencrypt/live/billing2.dipvtel.com/fullchain.pem' : (process.env.NODE_ENV=='development' ? '/etc/letsencrypt/live/billing-dev.dipvtel.com/fullchain.pem' : '')
export const PRIVATE_KEY = process.env.NODE_ENV=='production' ? '/etc/letsencrypt/live/billing2.dipvtel.com/privkey.pem' : (process.env.NODE_ENV=='development' ? '/etc/letsencrypt/live/billing-dev.dipvtel.com/privkey.pem' : '')
export const TEMPORARY = process.env.NODE_ENV=='production' ? '/tmp/' : (process.env.NODE_ENV=='development' ? '/tmp' : 'e:/tmp/')

export const SCP_SERVER = "208.78.161.26"
export const SCP_USER = "federicoalves"
export const SCP_PASS = "Akula123!"
export const SCP_PATH = "f:/federico/lerg*.zip"

export const LRN_SHELL_PATH = process.env.NODE_ENV=='production' ? '/usr/sbin' : (process.env.NODE_ENV=='development' ? '/usr/sbin' : '/usr/sbin')
export const LRN_SHELL_NAME = process.env.NODE_ENV=='production' ? 'download_lrn.sh' : (process.env.NODE_ENV=='development' ? 'download_lrn.sh' : 'download_lrn.sh')
export const LRN_DOWNLOADED_HOME = process.env.NODE_ENV=='production' ? '/lrn' : (process.env.NODE_ENV=='development' ? '/lrn' : 'e:/tmp')
export const LRN_DOWNLOADED_PATH = process.env.NODE_ENV=='production' ? '/lrn/home' : (process.env.NODE_ENV=='development' ? '/lrn/home' : 'e:/tmp')

export const LRN_API_URL = "http://208.73.232.248:8098/rest/lrn/get"