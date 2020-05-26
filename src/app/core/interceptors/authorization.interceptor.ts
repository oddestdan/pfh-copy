import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

import {AuthService} from '../services/auth.service';

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
  private readonly token: string;

  constructor(private authenticationService: AuthService) {
    this.token = localStorage.getItem('token');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const request = req.clone({setHeaders: {Authorization: this.token}});
    return next.handle(request);
  }
}


