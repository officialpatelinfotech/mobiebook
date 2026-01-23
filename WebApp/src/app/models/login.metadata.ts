export class LoginMetaData {
    UserName: string;
    UserPassword: string;
    RememberMe: boolean;
}

export class LoginResponse {
    UserId:number;
    UserType: string;
    UserTypeId: number;
    UserName: string;
    UserMenuDetails: string;
    Token: string;
}

export class ForgotPasswordMetaData
    {
        Email : string;
    }

    export class UpdatePasswordMetaData
    {
        Email: string;
         Password : string;
    }

