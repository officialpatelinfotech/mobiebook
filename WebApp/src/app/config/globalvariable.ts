import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl ?? 'http://localhost:5000/';

export const GLOBAL_VARIABLE = {
        SERVER_LINK: API_BASE_URL,
    API_LINK: 'api/',
    IMG_FOLDER: 'UploadImage/',
    SUCCESS: 'success',
    SUCCESS_MSG: 'Record Saved Successfully',
    UPDATE_MSG: 'Record Updated Successfully',
    DELETE_MSG: 'Record deleted successfully',
    DEFAULT_DATE_FORMAT: 'dd/MM/yyyy',
    DEFAULT_IMG: '../../assets/blank-img.png',
    DEFAULT_IMG_TP: '../../assets/blankImg.png',
    GROSS_TOTAL: 'Gross Total',
    TOTAL_AMOUNT: 'Total Amount',
    DELETE_CONFIRM_MESSAGE: 'Are you sure want to delete?',
    DEFAULT_CONFIRM_MESSAGE: 'Are you sure want to add default?',
    FAV_CONFIRM_MESSAGE: 'Are you sure want add to favourate?',
    SURE_MESSAGE: 'Are you sure?',
    CHANGE_PRICE: 'ChangePrice',
    CHANGE_COST: 'ChangeCost',
    PAYMENT_RECEIVED: 'Payment Received Successfully',
    AUTH_KEY: '90d55e03da084000ad59a16a8348032f',
    REGISTER_SUCCESS: 'Register Successfully',
    LOGIN_DETAIL: 'LOGINDETAIL',
    EMAIL_SUCESS_MSG: 'Please check your email to change the password',
    COUPON_ADDEDD: 'Coupon added successfully',
    PROFILE_ADDEDD: 'Profile update successfully',
    ERROR_MESSAGE_TYPE : 'Error',
    WARNING_MSG_TYPE: 'Warning',
    SUCCESS_MSG_TYPE: 'Success',
    TOKEN:'TOKEN',
    CART: 'CART',
    BULK_COUPONTYPE: 'Bulk',
    EALBUM_PUBLISH_MSG:'eAlbum published successfully',
    PUBLISH_CONFIRM_MSG: 'Are you sure you want to publish?',
    CUSTOMER_TOKEN:'CUSTOMERTOKEN',
    NEXT: 'next',
    PREVIOUS: 'previous',
    UPDATE_WINDOW_APP_ACTIVE: 'Window app has been activated for the selected user',
    UPDATE_WINDOW_APP_DEACTIVE: 'Window app has been deactivated for the selected user',
    UPDATE_WINDOW_USER_ACTIVE: 'User has been activated successfully',
    UPDATE_WINDOW_USER_DEACTIVE: 'User has been deactivated successfully',
    Register : 'Register',
    ForgotPassword: 'ForgotPassword',
    ChangePassword: 'ChangePassword',
    Setting: 'SETTING'
}

export enum BusinessType
{
    Lab = 2,
    PhotoGrapher = 1
}

export enum PageViewType {
    Front = "FRONT",
    Page = "PAGE",
    Back = "BACK",
    TPFront = "TPFRONT",
    TPBack = "TPBACK",
    Emboss = "EMBOSS"
}

export enum IMG_TYPE {
    Spread = "Spread",
    Page = "Page"
}

export const IMAGE_TYPE = [
    {Id: 'Spread', Text:'Spread'},
    {Id: 'Page',Text:'Page'}
]

export enum AlbumStatus
{
    OPEN = "OPEN",
    INPROGRESS = "INPROGRESS",
    PUBLISHED = "PUBLISHED"
}

export const ViewAlbumStatus = [
    {Id : "ALL", Text: "All"},
    {Id : "OPEN", Text: "Open"},
    {Id : "PUBLISHED", Text: "Published"}
]