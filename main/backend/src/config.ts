export const SERVER = "billing-dev.dipvtel.com"
export const PUBLIC_KEY = '/etc/letsencrypt/live/billing-dev.dipvtel.com/fullchain.pem'
export const PRIVATE_KEY = '/etc/letsencrypt/live/billing-dev.dipvtel.com/privkey.pem'
export const TEMPORARY = process.env.NODE_ENV=='production' ? '/tmp/' : 'e:/tmp/'

export const SCP_SERVER = "208.78.161.26"
export const SCP_USER = "federicoalves"
export const SCP_PASS = "Akula123!"
export const SCP_PATH = "f:/federico/lerg*.zip"

export const LRN_SHELL_PATH = process.env.NODE_ENV=='production' ? '/usr/sbin' : '/usr/sbin'
export const LRN_SHELL_NAME = process.env.NODE_ENV=='production' ? 'download_lrn.sh' : 'download_lrn.sh'
export const LRN_DOWNLOADED_PATH = process.env.NODE_ENV=='production' ? '/lrn/home' : '/lrn/home'
