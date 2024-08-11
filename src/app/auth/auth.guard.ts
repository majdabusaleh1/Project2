import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Promise<boolean | UrlTree>
    | Observable<boolean | UrlTree> {
    return this.authService.user.pipe(
      take(1),
      map((user) => {
        const isAuth = !!user;
        const emailVerified = user ? user.emailVerified : false;
        console.log("AuthGuard: User is authenticated:", isAuth);
        console.log("AuthGuard: Email is verified:", emailVerified);

        if (isAuth && emailVerified) {
          return true;
        } else if (isAuth && !emailVerified) {
          return this.router.createUrlTree(["/verify-email"]);
        } else {
          return this.router.createUrlTree(["/auth"]);
        }
      })
    );
  }
}
