export class LoginMetaData {
    UserName: string | undefined;
    UserPassword: string | undefined;
    RememberMe!: boolean;
}

export class LoginResponse {
    UserId: number | undefined;
    UserType: string | undefined;
    UserTypeId: number | undefined;
    UserName: string | undefined;
    UserMenuDetails: string | undefined;
    Token: string | undefined;
}

export class ForgotPasswordMetaData {
    Email: string | undefined;
}

export class UpdatePasswordMetaData {
    Email: string | undefined;
    Password: string | undefined;
}

