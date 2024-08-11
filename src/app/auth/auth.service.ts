import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, map, tap } from "rxjs/operators";
import { throwError, BehaviorSubject } from "rxjs";

import { User } from "./user.model";

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  private apiKey = "AIzaSyBJ0X7bjkGYZICe0d6pS21YAApDCfPNSE4";

  constructor(private http: HttpClient, private router: Router) {}

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=${this.apiKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          this.sendEmailVerification(resData.idToken).subscribe(() => {
            this.router.navigate(["/auth"], {
              queryParams: { emailNotVerified: true },
            });
          });
        })
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${this.apiKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          this.checkEmailVerified(resData.idToken).subscribe(
            (emailVerified) => {
              if (emailVerified) {
                this.handleAuthentication(
                  resData.email,
                  resData.localId,
                  resData.idToken,
                  +resData.expiresIn,
                  emailVerified
                );
                this.router.navigate(["/recipes"]);
              } else {
                this.handleAuthentication(
                  resData.email,
                  resData.localId,
                  resData.idToken,
                  +resData.expiresIn,
                  emailVerified
                );
                this.router.navigate(["/auth"], {
                  queryParams: { emailNotVerified: true },
                });
              }
            }
          );
        })
      );
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
      emailVerified: boolean;
    } = JSON.parse(localStorage.getItem("userData"));
    if (!userData) {
      return;
    }

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate),
      userData.emailVerified
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDuration =
        new Date(userData._tokenExpirationDate).getTime() -
        new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(["/auth"]);
    localStorage.removeItem("userData");
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  checkEmailVerified(idToken: string) {
    return this.http
      .post<any>(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.apiKey}`,
        {
          idToken: idToken,
        }
      )
      .pipe(map((response) => response.users[0].emailVerified));
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number,
    emailVerified: boolean
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate, emailVerified);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem("userData", JSON.stringify(user));
  }

  private sendEmailVerification(idToken: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: "VERIFY_EMAIL",
        idToken: idToken,
      }
    );
  }

  private handleError(errorRes: HttpErrorResponse) {
    console.log("Error Response:", errorRes); // Detailed log

    let errorMessage = "An unknown error occurred!";
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }

    switch (errorRes.error.error.message) {
      case "EMAIL_EXISTS":
        errorMessage = "This email exists already.";
        break;
      case "EMAIL_NOT_FOUND":
        errorMessage =
          "This email does not exist. You need to sign up before logging in.";
        break;
      case "INVALID_PASSWORD":
        errorMessage = "This password is not correct.";
        break;
      case "USER_DISABLED":
        errorMessage =
          "The user account has been disabled by an administrator.";
        break;
      case "OPERATION_NOT_ALLOWED":
        errorMessage = "Password sign-in is disabled for this project.";
        break;
      case "TOO_MANY_ATTEMPTS_TRY_LATER":
        errorMessage =
          "We have blocked all requests from this device due to unusual activity. Try again later.";
        break;
      case "INVALID_LOGIN_CREDENTIALS": // Add this case to handle the specific error message
        errorMessage =
          "The login credentials are incorrect. Please try again or sign up if you don't have an account.";
        break;
      default:
        errorMessage = errorRes.error.error.message; // Use the actual error message from the response
    }

    return throwError(errorMessage);
  }
}
